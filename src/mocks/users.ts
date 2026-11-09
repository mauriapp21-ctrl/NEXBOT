import type { Role, User } from "@/types";

export const CURRENT_USER_ID = "usr_dsoto";

export function createSeedRoles(): Role[] {
  return [
  {
    id: "admin",
    name: "Administrador",
    description: "Acceso total: gestiona usuarios, configuración y todas las automatizaciones.",
    permissions: [
      "automations.view",
      "automations.edit",
      "automations.delete",
      "automations.run",
      "versions.publish",
      "users.manage",
      "settings.manage",
    ],
  },
  {
    id: "editor",
    name: "Editor",
    description: "Crea, graba, edita y publica automatizaciones. No administra usuarios.",
    permissions: [
      "automations.view",
      "automations.edit",
      "automations.run",
      "versions.publish",
    ],
  },
  {
    id: "operator",
    name: "Operador",
    description: "Ejecuta bots publicados y revisa sus resultados.",
    permissions: ["automations.view", "automations.run"],
  },
  ];
}

export function createSeedUsers(now: Date): User[] {
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  return [
    {
      id: CURRENT_USER_ID,
      name: "Daniela Soto",
      email: "daniela.soto@planta-demo.cl",
      roleId: "admin",
      jobTitle: "Jefa de Mejora Continua",
      active: true,
      lastActiveAt: minutesAgo(1),
    },
    {
      id: "usr_mfuentes",
      name: "Matías Fuentes",
      email: "matias.fuentes@planta-demo.cl",
      roleId: "editor",
      jobTitle: "Analista de Procesos",
      active: true,
      lastActiveAt: minutesAgo(42),
    },
    {
      id: "usr_vrojas",
      name: "Valentina Rojas",
      email: "valentina.rojas@planta-demo.cl",
      roleId: "editor",
      jobTitle: "Ingeniera de Control de Gestión",
      active: true,
      lastActiveAt: minutesAgo(180),
    },
    {
      id: "usr_jcarcamo",
      name: "Jorge Cárcamo",
      email: "jorge.carcamo@planta-demo.cl",
      roleId: "operator",
      jobTitle: "Supervisor de Producción",
      active: true,
      lastActiveAt: minutesAgo(25),
    },
    {
      id: "usr_fmunoz",
      name: "Francisca Muñoz",
      email: "francisca.munoz@planta-demo.cl",
      roleId: "operator",
      jobTitle: "Encargada de Trazabilidad",
      active: true,
      lastActiveAt: minutesAgo(310),
    },
    {
      id: "usr_palvarado",
      name: "Pedro Alvarado",
      email: "pedro.alvarado@planta-demo.cl",
      roleId: "operator",
      jobTitle: "Jefe de Bodega",
      active: false,
      lastActiveAt: minutesAgo(60 * 24 * 21),
    },
  ];
}
