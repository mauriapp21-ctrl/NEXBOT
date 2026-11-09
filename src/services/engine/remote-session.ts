"use client";

/** Session for using the real engine from another address (see src/lib/server/session.ts). */
export interface RemoteSession {
  /** False when the server has no credentials configured: remote engine access is disabled. */
  configured: boolean;
  user: string | null;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `El servidor respondió ${response.status}.`);
  return data;
}

export const remoteSession = {
  async get(): Promise<RemoteSession> {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return { configured: false, user: null };
      return (await response.json()) as RemoteSession;
    } catch {
      return { configured: false, user: null };
    }
  },
  login: (user: string, password: string) => post<{ user: string }>("/api/auth/login", { user, password }),
  logout: () => post<{ ok: boolean }>("/api/auth/logout"),
};
