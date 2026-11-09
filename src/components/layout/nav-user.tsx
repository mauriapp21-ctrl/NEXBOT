"use client";

import { ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/format";
import { useSessionStore } from "@/stores/session-store";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const user = useSessionStore((s) => s.currentUser);
  const roleName = useSessionStore((s) => s.roles.find((r) => r.id === s.currentUser?.roleId)?.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
              aria-label="Menú de perfil"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary/25 text-xs font-semibold text-sidebar-accent-foreground">
                  {user ? initials(user.name) : ""}
                </AvatarFallback>
              </Avatar>
              {user ? (
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</span>
                  <span className="truncate text-xs text-sidebar-muted">{roleName}</span>
                </span>
              ) : (
                <span className="grid flex-1 gap-1">
                  <Skeleton className="h-3 w-24 bg-sidebar-accent" />
                  <Skeleton className="h-3 w-16 bg-sidebar-accent" />
                </span>
              )}
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-muted" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  toast.info("Perfil de usuario", {
                    description: "La edición del perfil no está disponible en el prototipo.",
                  })
                }
              >
                <User aria-hidden /> Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings aria-hidden /> Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun aria-hidden /> Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="light">
                      <Sun aria-hidden /> Claro
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon aria-hidden /> Oscuro
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor aria-hidden /> Sistema
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                toast.info("Sesión de demostración", {
                  description: "El prototipo no tiene inicio de sesión real, así que no hay sesión que cerrar.",
                })
              }
            >
              <LogOut aria-hidden /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
