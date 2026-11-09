import fs from "node:fs";
import http from "node:http";

import type { Step } from "../src/types/workflow";

import { recordings, startRecording, stopRecording } from "./recorder";
import { FILES_DIR } from "./run-step";
import { runs, startRun, stopRun } from "./runner";

/**
 * RPA Studio local engine. Runs bots for real in the installed Google Chrome.
 * Listens only on 127.0.0.1 and accepts browser requests only from the app.
 */
const PORT = Number(process.env.ENGINE_PORT ?? 4319);
const HOST = "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.ENGINE_ALLOWED_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",");
const VERSION = "1.0.0";

let busy = false;

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as T;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return send(res, 403, { error: "Origen no permitido." });
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return send(res, 204, {});

  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (req.method === "GET" && url.pathname === "/status") {
      return send(res, 200, { ok: true, version: VERSION, browser: "Google Chrome", busy, filesDir: FILES_DIR });
    }

    if (req.method === "POST" && url.pathname === "/runs") {
      if (busy) return send(res, 409, { error: "El motor ya está ejecutando o grabando otro bot." });
      const body = await readJson<{ steps: Step[]; variables?: Record<string, string>; startUrl?: string }>(req);
      if (!Array.isArray(body.steps) || body.steps.length === 0) return send(res, 400, { error: "El bot no tiene pasos." });
      busy = true;
      const run = startRun(body.steps, body.variables ?? {}, {
        startUrl: body.startUrl,
        onFinish: () => (busy = false),
      });
      return send(res, 202, { runId: run.id });
    }

    if (parts[0] === "runs" && parts[1]) {
      const run = runs.get(parts[1]);
      if (!run) return send(res, 404, { error: "Ejecución no encontrada." });
      if (req.method === "GET" && parts[2] === "events") return run.channel.subscribe(res);
      if (req.method === "POST" && parts[2] === "stop") return send(res, 200, { stopped: stopRun(run.id) });
      if (req.method === "GET" && parts[2] === "screenshots" && parts[3]) {
        const shot = run.screenshots.get(Number.parseInt(parts[3], 10));
        if (!shot) return send(res, 404, { error: "Captura no disponible." });
        res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "max-age=3600" });
        return res.end(shot);
      }
    }

    if (req.method === "POST" && url.pathname === "/recordings") {
      if (busy) return send(res, 409, { error: "El motor ya está ejecutando o grabando otro bot." });
      const body = await readJson<{ url?: string }>(req);
      if (!body.url || !/^https?:\/\//.test(body.url)) return send(res, 400, { error: "URL de inicio no válida." });
      busy = true;
      const recording = await startRecording(body.url).catch((error) => {
        busy = false;
        throw error;
      });
      recording.session?.context.on("close", () => (busy = false));
      return send(res, 201, { recordingId: recording.id });
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
    busy = false;
    send(res, 500, { error: error instanceof Error ? error.message.split("\n")[0] : "Error interno del motor." });
  }
});

fs.mkdirSync(FILES_DIR, { recursive: true });
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${PORT} ya está en uso: probablemente el motor ya está corriendo en otra terminal.`);
    process.exit(1);
  }
  throw error;
});
server.listen(PORT, HOST, () => {
  console.log(`RPA Studio · motor real local v${VERSION}`);
  console.log(`Escuchando en http://${HOST}:${PORT} (solo este equipo)`);
  console.log(`Carpeta de archivos de entrada: ${FILES_DIR}`);
});
