"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { isRemoteAccess } from "@/lib/engine-mode";
import { useEngineStore } from "@/stores/engine-store";

const noopSubscribe = () => () => {};

export type EngineAccess =
  | "checking"
  | "ready" // engine reachable
  | "local-off" // opened on this computer, engine not started
  | "remote-disabled" // remote access not configured on the server
  | "remote-login" // remote, needs to sign in
  | "remote-off"; // remote and signed in, but the engine is not running

export function useEngineAccess(): EngineAccess {
  const local = useEngineStore((s) => s.local);
  const checked = useEngineStore((s) => s.checked);
  const session = useEngineStore((s) => s.session);
  const remote = useSyncExternalStore(noopSubscribe, isRemoteAccess, () => false);
  if (!checked) return "checking";
  if (local) return "ready";
  if (!remote) return "local-off";
  if (!session?.configured) return "remote-disabled";
  if (!session.user) return "remote-login";
  return "remote-off";
}

export const ENGINE_ACCESS_TEXT: Record<Exclude<EngineAccess, "checking" | "ready">, { title: string; description: string; code?: string }> = {
  "local-off": {
    title: "El motor real local no está en ejecución",
    description: "Para trabajar con sitios web reales, abre una terminal en la carpeta del proyecto y ejecuta:",
    code: "pnpm engine",
  },
  "remote-disabled": {
    title: "El acceso remoto al motor no está habilitado",
    description:
      "El servidor no tiene credenciales configuradas, así que el motor real solo se puede usar desde el equipo donde corre (http://localhost:3000).",
  },
  "remote-login": {
    title: "Inicia sesión para usar el motor real",
    description: "Desde este enlace, grabar o ejecutar en Chrome requiere iniciar sesión. Los bots se ejecutan en el equipo servidor.",
  },
  "remote-off": {
    title: "El motor real no está en ejecución en el equipo servidor",
    description: "Tu sesión está activa, pero el motor no responde. En el equipo servidor, ejecuta:",
    code: "pnpm engine",
  },
};

export function LoginButton({ size = "default" }: { size?: "default" | "sm" }) {
  const pathname = usePathname();
  return (
    <Button size={size} asChild>
      <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
        <LogIn aria-hidden /> Iniciar sesión
      </Link>
    </Button>
  );
}

/** Header shortcut, visible on every screen size, only when opened from another address without a session. */
export function HeaderLoginButton() {
  const access = useEngineAccess();
  const pathname = usePathname();
  if (access !== "remote-login") return null;
  return (
    <Button asChild size="sm" variant="outline" className="mr-1" title="Iniciar sesión para usar el motor real">
      <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
        <LogIn aria-hidden />
        <span className="hidden sm:inline">Iniciar sesión</span>
        <span className="sm:hidden">Entrar</span>
      </Link>
    </Button>
  );
}

export function LogoutButton({ size = "sm" }: { size?: "default" | "sm" }) {
  const logout = useEngineStore((s) => s.logout);
  return (
    <Button
      size={size}
      variant="outline"
      onClick={async () => {
        await logout().catch(() => undefined);
        toast.success("Sesión cerrada", { description: "El motor real ya no se puede usar desde este navegador." });
      }}
    >
      <LogOut aria-hidden /> Cerrar sesión
    </Button>
  );
}
