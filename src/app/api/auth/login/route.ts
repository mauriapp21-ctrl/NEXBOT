import { NextResponse } from "next/server";
import { z } from "zod";

import {
  checkCredentials,
  clearFailures,
  clientKey,
  createSessionToken,
  lockedFor,
  loginConfigured,
  registerFailure,
  sameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

const schema = z.object({ user: z.string().max(100), password: z.string().max(200) });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  if (!loginConfigured()) {
    return NextResponse.json(
      { error: "El acceso remoto al motor no está configurado en el servidor (faltan las credenciales en .env.local)." },
      { status: 503 },
    );
  }

  const key = clientKey(request.headers);
  const wait = lockedFor(key);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Vuelve a intentarlo en ${Math.ceil(wait / 60000)} min.` },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !checkCredentials(parsed.data.user, parsed.data.password)) {
    registerFailure(key);
    // Small fixed delay slows down automated guessing.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  clearFailures(key);
  const response = NextResponse.json({ user: parsed.data.user });
  response.cookies.set(SESSION_COOKIE, createSessionToken(parsed.data.user), sessionCookieOptions(request));
  return response;
}
