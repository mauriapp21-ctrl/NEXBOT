import { cookies } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // shadcn's sidebar persists its open/collapsed state in this cookie.
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <DataBootstrap />
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <main id="contenido" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
