import { Plus } from "lucide-react";
import Link from "next/link";

import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-1.5 focus:text-sm focus:shadow"
      >
        Saltar al contenido
      </a>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <AppBreadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <Button asChild size="sm" className="mr-1 hidden sm:inline-flex">
          <Link href="/automations/new">
            <Plus aria-hidden /> Crear automatización
          </Link>
        </Button>
        <Button asChild size="icon-sm" className="mr-1 sm:hidden" aria-label="Crear automatización">
          <Link href="/automations/new">
            <Plus aria-hidden />
          </Link>
        </Button>
        <GlobalSearch />
        <ThemeToggle />
        <NotificationsMenu />
      </div>
    </header>
  );
}
