import fs from "node:fs";
import http from "node:http";

import { recordings, startRecording, stopRecording } from "./recorder";
import { FILES_DIR } from "./run-step";
import { runs, startRun, stopRun } from "./runner";
import { assertWebUrl, MAX_BODY_BYTES, validateRunBody, ValidationError } from "./validation";

/**
 * RPA Studio local engine. Runs bots for real in the installed Google Chrome.
 *
 * Security model (the engine has no login, so it must not be reachable by
 * anyone else):
 * - listens only on 127.0.0.1 (not reachable from the network);
 * - Host header must be this engine (blocks DNS-rebinding attacks);
 * - browser requests must come from the app's origin (CORS allow-list);
 * - POST bodies must be JSON (forces a CORS preflight in browsers), ≤ 1 MB;
 * - every step is validated and only http(s) pages can be opened.
 */
const PORT = Number(process.env.ENGINE_PORT ?? 4319);
const HOST = "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.ENGINE_ALLOWED_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const VERSION = "1.1.0";

let busy = false;

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  if (!(req.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "El cuerpo debe enviarse como JSON.");
  }
  const declared = Number(req.headers["content-length"] ?? 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, "La solicitud es demasiado grande.");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "La solicitud es demasiado grande.");
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new HttpError(400, "El cuerpo no es un JSON válido.");
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (!ALLOWED_HOSTS.has((req.headers.host ?? "").toLowerCase())) return send(res, 421, { error: "Host no permitido." });
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return send(res, 403, { error: "Origen no permitido." });
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (req.method === "GET" && url.pathname === "/status") {
      return send(res, 200, { ok: true, version: VERSION, browser: "Google Chrome", busy, filesDir: FILES_DIR });
    }

    if (req.method === "POST" && url.pathname === "/runs") {
      const body = validateRunBody(await readJson(req));
      if (busy) return send(res, 409, { error: "El motor ya está ejecutando o grabando otro bot." });
      busy = true;
      const run = startRun(body.steps, body.variables, { startUrl: body.startUrl, onFinish: () => (busy = false) });
      return send(res, 202, { runId: run.id });
    }

    if (parts[0] === "runs" && parts[1]) {
      const run = runs.get(parts[1]);
      if (!run) return send(res, 404, { error: "Ejecución no encontrada." });
      if (req.method === "GET" && parts[2] === "events") return run.channel.subscribe(res);
      if (req.method === "POST" && parts[2] === "stop") return send(res, 200, { stopped: stopRun(run.id) });
      if (req.method === "GET" && parts[2] === "screenshots" && /^\d{1,3}\.jpg$/.test(parts[3] ?? "")) {
        const shot = run.screenshots.get(Number.parseInt(parts[3], 10));
        if (!shot) return send(res, 404, { error: "Captura no disponible." });
        res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
        return res.end(shot);
      }
    }

    if (req.method === "POST" && url.pathname === "/recordings") {
      const body = (await readJson(req)) as { url?: unknown };
      const startUrl = assertWebUrl(typeof body?.url === "string" ? body.url : "", "La URL de inicio");
      if (busy) return send(res, 409, { error: "El motor ya está ejecutando o grabando otro bot." });
      busy = true;
      try {
        const recording = await startRecording(startUrl);
        recording.session?.context.on("close", () => (busy = false));
        return send(res, 201, { recordingId: recording.id });
      } catch (error) {
        busy = false;
        throw error;
      }
    }

    if (parts[0] === "recordings" && parts[1]) {
      const recording = recordings.get(parts[1]);
      if (!recording) return send(res, 404, { error: "Grabación no encontrada." });
      if (req.method === "GET" && parts[2] === "events") return recording.channel.subscribe(res);
      if (req.method === "POST" && parts[2] === "stop") {
        await stopRecording(recording.id);
        busy = false;
        return send(res, 200, { stopped: true });
      }
    }

    send(res, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    if (error instanceof HttpError) return send(res, error.status, { error: error.message });
    if (error instanceof ValidationError) return send(res, 400, { error: error.message });
    console.error("[motor] error inesperado:", error);
    send(res, 500, { error: "Error interno del motor." });
  }
});

// Slow or stuck clients cannot hold connections forever (event streams excluded).
server.headersTimeout = 15_000;
server.requestTimeout = 30_000;

// A failure inside a run must never take the whole engine down.
process.on("unhandledRejection", (reason) => console.error("[motor] promesa rechazada sin manejar:", reason));
process.on("uncaughtException", (error) => console.error("[motor] excepción no capturada:", error));

fs.mkdirSync(FILES_DIR, { recursive: true });
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${PORT} ya está en uso: probablemente el motor ya está corriendo en otra terminal.`);
    process.exit(1);
  }
  console.error("[motor] error del servidor:", error);
});
server.listen(PORT, HOST, () => {
  console.log(`RPA Studio · motor real local v${VERSION}`);
  console.log(`Escuchando en http://${HOST}:${PORT} (solo este equipo)`);
  console.log(`Orígenes permitidos: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`Carpeta de archivos de entrada: ${FILES_DIR}`);
});
