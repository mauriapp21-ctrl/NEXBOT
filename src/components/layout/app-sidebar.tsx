"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { EngineStatusIndicator } from "@/components/layout/engine-status";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, navSections } from "@/lib/navigation";

function Logo() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
        <rect x="4" y="7" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="9.5" cy="12.5" r="1.5" fill="currentColor" />
        <circle cx="14.5" cy="12.5" r="1.5" fill="currentColor" />
        <path d="M12 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="RPA Studio" className="hover:bg-sidebar-accent">
              <Link href="/dashboard" onClick={closeOnMobile}>
                <Logo />
                <span className="grid leading-tight">
                  <span className="text-sm font-semibold text-sidebar-accent-foreground">RPA Studio</span>
                  <span className="text-xs text-sidebar-muted">Planta de proceso</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-sidebar-muted">{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                      >
                        <Link href={item.href} aria-current={active ? "page" : undefined} onClick={closeOnMobile}>
                          <item.icon aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1">
        <EngineStatusIndicator />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
