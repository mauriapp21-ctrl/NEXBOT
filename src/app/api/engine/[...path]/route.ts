import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readSessionToken, sameOrigin, SESSION_COOKIE } from "@/lib/server/session";

/**
 * Authenticated gateway to the real engine for remote access (e.g. the
 * tunnel). The engine itself keeps listening only on 127.0.0.1; this server,
 * running on the same computer, forwards requests only for a signed-in user
 * and only to the engine's known routes.
 */
export const dynamic = "force-dynamic";

const ENGINE = `http://127.0.0.1:${process.env.ENGINE_PORT ?? 4319}`;
const ID = "[0-9a-f-]{36}";
const ALLOWED: Record<"GET" | "POST", RegExp[]> = {
  GET: [/^status$/, new RegExp(`^runs/${ID}/events$`), new RegExp(`^runs/${ID}/screenshots/\\d{1,3}\\.jpg$`), new RegExp(`^recordings/${ID}/events$`)],
  POST: [/^runs$/, new RegExp(`^runs/${ID}/stop$`), /^recordings$/, new RegExp(`^recordings/${ID}/stop$`)],
};

async function forward(request: Request, method: "GET" | "POST", segments: string[]) {
  const user = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión para usar el motor real desde este enlace." }, { status: 401 });
  if (method === "POST" && !sameOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });

  const path = segments.join("/");
  if (!ALLOWED[method].some((pattern) => pattern.test(path))) {
    return NextResponse.json({ error: "Ruta no encontrada." }, { status: 404 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > 1_000_000) {
    return NextResponse.json({ error: "La solicitud es demasiado grande." }, { status: 413 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${ENGINE}/${path}`, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? await request.text() : undefined,
      signal: request.signal, // stops the event stream when the viewer leaves
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "El motor real no está en ejecución en el equipo servidor." }, { status: 503 });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) headers.set("Content-Type", type);
  if (type?.startsWith("text/event-stream")) {
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("X-Accel-Buffering", "no");
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function GET(request: Request, ctx: RouteContext<"/api/engine/[...path]">) {
  return forward(request, "GET", (await ctx.params).path);
}

export async function POST(request: Request, ctx: RouteContext<"/api/engine/[...path]">) {
  return forward(request, "POST", (await ctx.params).path);
}
