# CLAUDE.md — NEXBOT / RPA Studio

Este archivo es el contexto permanente del proyecto. Léelo completo antes de cualquier tarea y respétalo en todas las sesiones.

## Qué es el proyecto

RPA Studio (nombre de producto provisional; la carpeta del repo es `C:\NEXBOT`) es una plataforma SaaS para crear, grabar, editar, ejecutar y mantener bots que automatizan procesos en sistemas web. El usuario objetivo no programa: todo se configura visualmente.

La app tiene dos modos de motor, y la interfaz siempre debe dejar claro cuál se usa:

- **Simulado** (por defecto): datos y servicios mock; la grabación y la ejecución de los bots de demostración (sistemas `*.planta-demo.cl`) son simulaciones guionadas dentro del navegador. Nunca se debe afirmar que son reales.
- **Real local** (opcional, aprobado el 08-11-2026): el motor de `engine/` (`pnpm engine`) controla el Google Chrome instalado con Playwright. Los bots cuya URL es un sitio real se graban y ejecutan de verdad. Escucha solo en `127.0.0.1:4319` y acepta peticiones solo desde la app. Las contraseñas grabadas nunca se guardan (se reemplazan por la variable secreta `{{clave_sitio}}`). Si una acción no está implementada en el motor real, se marca como omitida con advertencia; nunca se finge.

No hay backend de datos: automatizaciones, ejecuciones y versiones siguen en el store mock persistido.

El escenario de los datos de ejemplo es una planta procesadora de salmón (trazabilidad, producción diaria, inventario, reportes).

## Entorno

- Sistema operativo: Windows. Terminal por defecto: PowerShell. No uses comandos exclusivos de bash (`rm -rf`, `export`, `&&` encadenado en PowerShell 5). Prefiere scripts de `package.json` multiplataforma.
- Gestor de paquetes: `pnpm` (si no está instalado, usa `npm` y deja constancia en el README). No mezcles lockfiles.
- Node 20 LTS o superior.

## Stack (no lo cambies sin pedir confirmación)

- Next.js 15+ con App Router, React 19, TypeScript en modo `strict`.
- Tailwind CSS v4 + shadcn/ui (inicializado con `npx shadcn@latest init`). Iconos con `lucide-react`.
- Editor de flujos: `@xyflow/react` (es el paquete actual de React Flow; no instales `reactflow`, está deprecado).
- Estado: Zustand con middleware `persist` (localStorage) para que lo creado en la demo sobreviva a la navegación y al refresco. Incluye una acción `resetDemoData()` accesible desde Configuración.
- Animaciones: `framer-motion` (o `motion`, su nombre actual). Gráficos: `recharts`. Tablas: `@tanstack/react-table`.
- Tema claro/oscuro: `next-themes`. Notificaciones: `sonner` (vía shadcn). Fechas: `date-fns` con locale `es`.
- Drag & drop de listas (reordenar pasos): `@dnd-kit/core` + `@dnd-kit/sortable`.
- Formularios: `react-hook-form` + `zod`.
- Motor real local: `playwright-core` con el Chrome instalado (`channel: "chrome"`, sin descargar navegadores), servidor HTTP + SSE en `engine/`, ejecutado con `tsx`. El script inyectado para grabar (`engine/inject/recorder.js`) es JavaScript plano y se carga como texto (no serializar funciones TS: `tsx` agrega helpers que no existen en la página).

## Comandos

- `pnpm dev` — servidor de desarrollo.
- `pnpm engine` — motor real local (abre Chrome visible). Archivos de entrada en `engine/files/`; perfil de Chrome en `.engine-profile/` (ignorado por git).
- `pnpm build` — build de producción (debe pasar sin errores al cerrar cada fase).
- `pnpm lint` — ESLint.
- `pnpm typecheck` — `tsc --noEmit` (créalo en `package.json` si no existe).
- `pnpm test:e2e` — Playwright con el Chrome instalado: recorre los 7 pasos de la demo (`e2e/demo.spec.ts`) contra un build de producción en el puerto 3100. También corre en el CI.

## Arquitectura

Organización por *feature*, no por tipo de archivo. Cada feature contiene sus componentes, hooks y lógica; `components/ui` queda solo para primitivas de shadcn y `components/shared` para piezas transversales.

```
src/
  app/
    (app)/                 # layout con sidebar + header
      dashboard/
      automations/
        new/               # asistente de creación
        [id]/
      recorder/[id]/
      editor/[id]/
      executions/
        [id]/
      maintenance/[id]/
      versions/[id]/
      library/             # biblioteca de acciones
      templates/
      users/
      settings/
      integrations/
    layout.tsx
    page.tsx               # redirige a /dashboard
  components/
    ui/                    # shadcn (no editar a mano salvo theming)
    layout/                # AppSidebar, AppHeader, EngineStatus, ThemeToggle
    shared/                # StatusBadge, MetricCard, EmptyState, ConfirmationDialog, PageHeader
  features/
    dashboard/
    automations/           # BotCard, filtros, asistente
    recorder/              # RecorderToolbar, BrowserSimulator, ActionTimeline, mock target app
    workflow/              # WorkflowCanvas, ActionLibrary, NodePropertiesPanel, nodos custom
    executions/            # ExecutionTable, ExecutionConsole, ScreenshotViewer, simulador
    maintenance/           # comparador de selectores, reparación
    versions/              # VersionHistory, diff de versiones
  services/                # interfaces + implementación mock (ver abajo)
  stores/                  # stores de Zustand
  types/                   # tipos de dominio compartidos
  mocks/                   # datos semilla
  lib/                     # utils, constantes, formateadores
```

### Capa de servicios

Los componentes nunca leen `mocks/` directamente. Cada dominio expone una interfaz (`AutomationService`, `ExecutionService`, `RecorderService`, `VersionService`) y una implementación `mock*` que devuelve promesas con latencia simulada (150–600 ms) y, cuando corresponde, errores simulados. Así, el día que exista backend se reemplaza la implementación sin tocar la UI. Los tipos de `types/` deben modelar lo que devolvería una API real (ids, timestamps ISO, enums de estado).

### Tipos de dominio mínimos

`Automation`, `AutomationStatus` (`active | draft | error | maintenance | disabled`), `Step` / `WorkflowNode` (tipo de acción, selector, parámetros, timeout, reintentos), `Execution`, `ExecutionStepResult` (`pending | running | completed | warning | error | skipped`), `RecordedInteraction`, `AutomationVersion`, `SelectorIssue`, `User`, `Role`.

Un mismo modelo de pasos alimenta el grabador, el editor y la ejecución: lo que se graba se convierte en nodos del editor, y los nodos son lo que ejecuta el simulador. No crees tres representaciones distintas.

## Identidad visual

Referencias: Linear, Vercel, Retool. Minimalista, denso en información pero con aire, jerarquía clara. Nada que recuerde a Power BI ni a paneles administrativos con tablas grises.

Tokens (defínelos como variables CSS en el tema de shadcn, con su par para modo oscuro; nunca hex sueltos en componentes):

| Token | Claro | Uso |
|---|---|---|
| background | #F7F8FA | fondo de la app |
| foreground | #202938 | texto principal |
| muted-foreground | #718096 | texto secundario |
| border | #E5E7EB | bordes |
| navy | #172B4D | sidebar, encabezados fuertes |
| primary | #356AE6 | acciones principales |
| accent / teal | #0096A0 | acentos, grabador |
| success | #16A36A | completado |
| warning | #F59E0B | advertencia, mantenimiento |
| destructive | #E5484D | error, REC |

Tipografía Inter vía `next/font/google`. Usa `font-variant-numeric: tabular-nums` en métricas y tablas. Escritorio primero; tablet y móvil deben ser usables (sidebar colapsable a drawer), pero el editor y el grabador pueden mostrar un aviso de "mejor en escritorio" bajo 768 px.

## Reglas de calidad

- Todo texto de interfaz en español de Chile; código, nombres de archivos y comentarios en inglés.
- Fechas en formato `dd-MM-yyyy HH:mm`. Los datos semilla se generan relativos a "hoy" para que la demo nunca se vea desactualizada.
- Ningún botón muerto. Si una acción está fuera del alcance del prototipo, igual debe responder (toast descriptivo, diálogo o navegación). Nunca `onClick={() => {}}`.
- Toda acción destructiva pasa por `ConfirmationDialog`.
- Cada lista o tabla tiene estado vacío (`EmptyState`) y estado de carga (skeleton).
- Accesibilidad básica: foco visible, roles ARIA en componentes custom, contraste AA, operable con teclado en listas reordenables.
- Componentes de más de ~200 líneas se dividen.
- No inventes métricas sin base: el "tiempo ahorrado" se calcula como (duración manual estimada − duración del bot) × ejecuciones exitosas, con la duración manual definida en cada automatización.

## Definición de terminado (por fase)

1. `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan sin errores.
2. Revisaste la pantalla en el navegador en modo claro y oscuro, y a 1440 px y 390 px de ancho.
3. Commit con mensaje convencional (`feat(recorder): ...`).
4. Reporte breve: qué se hizo, qué quedó pendiente, decisiones tomadas.
