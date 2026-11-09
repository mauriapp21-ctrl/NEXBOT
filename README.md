# RPA Studio (NEXBOT)

Plataforma para crear, grabar, editar, ejecutar y mantener bots que automatizan procesos en sistemas web, pensada para usuarios que no programan: todo se configura de forma visual.

El escenario de los datos de ejemplo es una planta procesadora de salmón (trazabilidad, producción, inventario, calidad y despachos).

## Dos motores, siempre identificados

| Motor | Qué hace | Cuándo se usa |
|---|---|---|
| **Simulado** | La grabación y la ejecución son simulaciones guionadas dentro del navegador, sobre un sistema de destino falso pero navegable ("Sistema de trazabilidad operacional"). | Bots de demostración de la planta (sistemas `*.planta-demo.cl`). Funciona siempre, sin instalar nada más. |
| **Real local** | Graba y ejecuta los bots en tu **Google Chrome**, en tu equipo, con Playwright. | Bots cuya URL es un sitio web real. Requiere iniciar el motor (`pnpm engine`). |

El indicador de la barra lateral muestra **Motor real conectado** o **Motor simulado**, y cada ejecución indica si fue *Real* o *Simulada*. No hay backend de datos: automatizaciones, ejecuciones y versiones se guardan en el navegador (`localStorage`).

## Requisitos

- Node 20 o superior
- pnpm
- Google Chrome (solo para el motor real y la prueba automática)

## Puesta en marcha

```bash
pnpm install     # instalar dependencias
pnpm dev         # app en http://localhost:3000
pnpm engine      # (opcional, en otra terminal) motor real local en 127.0.0.1:4319
```

## Comandos

| Comando | Para qué |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm typecheck` | Verificación de tipos |
| `pnpm lint` | ESLint |
| `pnpm test:e2e` | Prueba automática del recorrido de la demo (Playwright con tu Chrome; levanta su propio servidor en el puerto 3100) |
| `pnpm engine` | Motor real local |

El CI de GitHub ejecuta typecheck, lint, build y la prueba del recorrido en cada cambio a `main`.

## Guion de la demo (unos 5 minutos)

Antes de empezar: **Configuración → Restablecer datos de demo** (y deja el sistema simulado en "se actualiza tras la primera importación").

1. **Crear el bot.** *Crear automatización → Usar datos de ejemplo → Trazabilidad diaria*. Avanza por las cuatro etapas y pulsa **Crear y grabar**.
2. **Grabar.** En el grabador, pulsa **Reproducir grabación de ejemplo** (o **Iniciar grabación** y hazlo a mano: usuario, contraseña, Ingresar, menú Trazabilidad, turno, `Trazabilidad_Diaria.xlsx`, Importar información). Verás las 8 interacciones en la línea de tiempo. **Guardar** abre el editor.
3. **Editar.** Selecciona *Seleccionar turno* y cambia su nombre. Selecciona el último paso y agrega **Validar texto** desde la biblioteca (selector `[data-rec-message]`, texto `Información importada`). **Publicar versión**.
4. **Ejecutar.** Pulsa **Ejecutar**: sigue el progreso con los pasos, la consola y las capturas. Al terminar llega el aviso *"El Sistema de trazabilidad se actualizó"*.
5. **Falla.** Pulsa **Ejecutar de nuevo**: el bot falla porque el botón "Importar información" ahora se llama "Procesar archivo".
6. **Reparar.** Pulsa **Reparar en mantenimiento**: compara el selector anterior con el elemento detectado y las capturas de antes y ahora. **Probar selector → Reemplazar → Guardar nueva versión**. (También puedes **Volver a grabar este paso**).
7. **Versiones.** Abre **Versiones**: compara la versión 1 con la 2 (selector modificado) y **Restaura** la versión anterior si quieres.

### Prueba con un sitio real

1. En una segunda terminal: `pnpm engine`. La barra lateral cambia a **Motor real conectado**.
2. *Crear automatización → Usar datos de ejemplo → Formulario web de prueba* (formulario público de práctica de Selenium), o usa la plantilla **Formulario web (sitio real)**.
3. **Iniciar grabación en Chrome**: se abre una ventana real; completa el formulario y envíalo. **Detener → Guardar → Ejecutar**.

Notas del motor real:

- Los archivos que el bot adjunta deben estar en `engine/files/` (incluye `Documento_Prueba.txt`).
- Las contraseñas escritas al grabar **no se guardan**: el paso usa la variable secreta `{{clave_sitio}}`, cuyo valor se define en el editor (panel *Propiedades del bot*).
- El perfil de Chrome del motor se guarda en `.engine-profile/` (ignorado por git): si inicias sesión a mano en un sitio, los bots reutilizan esa sesión.
- Condiciones, ciclos y "Leer Excel" todavía no se ejecutan en el motor real: se marcan como omitidos con advertencia.
- El motor escucha solo en `127.0.0.1` y acepta peticiones únicamente desde la app.

## Pantallas

Dashboard · Mis automatizaciones · Detalle de bot · Asistente de creación · Grabador (simulado y real) · Editor visual · Detalle de ejecución en vivo · Historial de ejecuciones · Mantenimiento · Versiones · Biblioteca de acciones · Plantillas · Usuarios y permisos · Integraciones · Configuración. Además, `/dev/ui` muestra el sistema visual (tokens y componentes compartidos).

## Arquitectura

- **Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4 + shadcn/ui, `@xyflow/react`, Zustand, recharts, TanStack Table v9, dnd-kit, react-hook-form + zod, date-fns. Motor real: `playwright-core` + Node (`engine/`).
- **Por funcionalidad:** `src/features/*` (dashboard, automations, recorder, workflow, executions, maintenance, versions…), `src/components/{ui,layout,shared}`.
- **Servicios:** la interfaz solo usa los contratos de `src/services/types.ts`; hoy los implementa un backend simulado (`src/services/mock`) persistido en el navegador. Para conectar un backend real se reemplazan esas implementaciones sin tocar la interfaz.
- **Un solo modelo de pasos** (`Step` / `WorkflowNode`): lo que se graba se convierte en nodos del editor, y esos nodos son lo que ejecutan ambos motores.

El contexto completo del proyecto (reglas, tokens visuales, definición de terminado) está en [CLAUDE.md](CLAUDE.md).

## Problemas frecuentes

- **No veo los cambios después de actualizar el código:** recarga la página (F5).
- **Quiero empezar de cero:** Configuración → Restablecer datos de demo.
- **"El motor real local no está en ejecución":** abre una terminal en la carpeta del proyecto y ejecuta `pnpm engine`.
- **"El puerto 4319 ya está en uso":** el motor ya está corriendo en otra terminal.

`video-automation-anywhere/` es un proyecto Remotion independiente (pieza publicitaria) y queda fuera de este repositorio.
