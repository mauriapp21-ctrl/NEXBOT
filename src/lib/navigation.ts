import {
  Bot,
  GitCompare,
  History,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  Plug,
  Settings,
  Users,
  Video,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Extra keywords for the global search. */
  keywords?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["inicio", "métricas"] },
      { title: "Mis automatizaciones", href: "/automations", icon: Bot, keywords: ["bots", "procesos"] },
      { title: "Historial de ejecuciones", href: "/executions", icon: History, keywords: ["ejecuciones", "logs"] },
    ],
  },
  {
    title: "Diseño y desarrollo",
    items: [
      { title: "Grabador", href: "/recorder", icon: Video, keywords: ["grabar", "rec"] },
      { title: "Editor visual", href: "/editor", icon: Workflow, keywords: ["flujo", "nodos"] },
      { title: "Mantenimiento", href: "/maintenance", icon: Wrench, keywords: ["selectores", "reparar"] },
      { title: "Versiones", href: "/versions", icon: GitCompare, keywords: ["historial", "comparar"] },
      { title: "Biblioteca de acciones", href: "/library", icon: Library, keywords: ["acciones", "documentación"] },
      { title: "Plantillas", href: "/templates", icon: LayoutTemplate, keywords: ["plantilla"] },
    ],
  },
  {
    title: "Administración",
    items: [
      { title: "Usuarios y permisos", href: "/users", icon: Users, keywords: ["roles", "equipo"] },
      { title: "Integraciones", href: "/integrations", icon: Plug, keywords: ["conectores", "api"] },
      { title: "Configuración", href: "/settings", icon: Settings, keywords: ["ajustes", "demo"] },
    ],
  },
];

export const allNavItems = navSections.flatMap((section) => section.items);

/** Labels for route segments used by the breadcrumbs. */
export const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  automations: "Mis automatizaciones",
  new: "Nueva automatización",
  recorder: "Grabador",
  editor: "Editor visual",
  executions: "Historial de ejecuciones",
  maintenance: "Mantenimiento",
  versions: "Versiones",
  library: "Biblioteca de acciones",
  templates: "Plantillas",
  users: "Usuarios y permisos",
  settings: "Configuración",
  integrations: "Integraciones",
  dev: "Desarrollo",
  ui: "Sistema visual",
};

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
