import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loginConfigured, readSessionToken, SESSION_COOKIE } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Who is signed in for remote engine access (no secrets are returned). */
export async function GET() {
  const user = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  return NextResponse.json({ configured: loginConfigured(), user }, { headers: { "Cache-Control": "no-store" } });
}
