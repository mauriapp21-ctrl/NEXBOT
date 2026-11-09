"use client";

import { Bell, CheckCheck, CircleX, GitCompare, Info, Wrench, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import type { AppNotification, NotificationKind } from "@/types";

const kindIcon: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
  execution_failed: { icon: CircleX, className: "bg-destructive/12 text-destructive-ink" },
  maintenance: { icon: Wrench, className: "bg-warning/15 text-warning-ink" },
  version: { icon: GitCompare, className: "bg-success/12 text-success-ink" },
  info: { icon: Info, className: "bg-primary/12 text-primary-ink" },
};

export function NotificationsMenu() {
  const router = useRouter();
  const notifications = useSessionStore((s) => s.notifications);
  const status = useSessionStore((s) => s.status);
  const markRead = useSessionStore((s) => s.markNotificationRead);
  const markAllRead = useSessionStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;

  const open = (notification: AppNotification) => {
    void markRead(notification.id);
    if (notification.href) router.push(notification.href);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span className="tabular absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive-strong px-1 text-[10px] leading-4 font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Notificaciones</p>
          <Button variant="ghost" size="xs" onClick={() => void markAllRead()} disabled={unread === 0}>
            <CheckCheck aria-hidden /> Marcar todas como leídas
          </Button>
        </div>
        {status !== "ready" ? (
          <div className="space-y-3 p-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState variant="compact" icon={Bell} title="Sin notificaciones" description="Aquí verás fallos y avisos de mantenimiento." />
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {notifications.map((n) => {
                const { icon: Icon, className } = kindIcon[n.kind];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted",
                        !n.read && "bg-primary/[0.04]",
                      )}
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", className)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.description}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
