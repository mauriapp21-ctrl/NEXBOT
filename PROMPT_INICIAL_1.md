# Prompt de arranque para Claude Code — RPA Studio

Pega esto en Claude Code abierto en `C:\NEXBOT`, con `CLAUDE.md` ya copiado en esa misma carpeta.

---

Actúa como Senior Product Designer y Senior Frontend Engineer especializado en SaaS empresarial. Vas a construir el frontend de RPA Studio, descrito en `CLAUDE.md`. Léelo completo primero: ahí están el stack, la arquitectura, los tokens visuales y la definición de terminado. Este mensaje define el **orden de trabajo** y el **criterio de éxito**.

## Criterio de éxito

Al final, una persona debe poder recorrer sin ayuda este caso de punta a punta, con datos simulados y sin recargar a mano nada:

1. Crear el bot "Carga de información de trazabilidad" con el asistente.
2. Grabar el procedimiento en el grabador simulado (8 interacciones, incluida la selección de `Trazabilidad_Diaria.xlsx`).
3. Abrir el editor, ver los pasos grabados convertidos en nodos conectados, editar uno y agregar una validación.
4. Ejecutar el bot y seguir su progreso paso a paso con consola y capturas.
5. Ejecutarlo de nuevo y que falle porque el botón "Importar información" ahora se llama "Procesar archivo".
6. Ir a mantenimiento desde el error, probar el selector propuesto, reemplazarlo y guardar una nueva versión.
7. Ver esa versión en el historial, compararla con la anterior y poder restaurar.

Si una decisión de diseño no ayuda a este recorrido, tiene menor prioridad.

## Cómo trabajar

Trabaja por fases, en orden. Al cerrar cada fase aplica la definición de terminado de `CLAUDE.md` (typecheck, lint, build, revisión visual, commit, reporte). Antes de cada fase, usa modo plan: muéstrame en pocas líneas qué archivos vas a crear y qué decisiones vas a tomar. **Detente y espera mi aprobación al terminar la Fase 1 y la Fase 4**; en el resto continúa salvo que encuentres un bloqueo o una ambigüedad que cambie la arquitectura.

Si `C:\NEXBOT` ya tiene un proyecto, analiza primero `package.json`, la estructura y las versiones instaladas, y dime qué difiere de `CLAUDE.md` antes de tocar nada. Si está vacío, inicialízalo con `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/`, alias `@/*`).

## Fase 0 — Inicialización

Proyecto Next.js, dependencias del stack, shadcn inicializado, scripts `typecheck` y `test:e2e` (este último puede quedar vacío hasta la Fase 7), Git inicializado con `.gitignore` correcto.

## Fase 1 — Fundaciones y sistema visual (pausa al final)

Tokens de color claro/oscuro, Inter, `ThemeProvider`, layout `(app)` con `AppSidebar` (secciones General, Diseño y desarrollo, Administración; logo; perfil; indicador de conexión del motor simulado; colapsable y persistido) y `AppHeader` (breadcrumbs, búsqueda global con `Cmd/Ctrl+K`, toggle de tema, notificaciones). Componentes compartidos: `StatusBadge`, `MetricCard`, `EmptyState`, `ConfirmationDialog`, `PageHeader`.

Tipos de dominio, datos semilla completos (al menos 8 automatizaciones en todos los estados, 60+ ejecuciones de los últimos 30 días, 3–5 versiones por bot, usuarios con roles Administrador/Editor/Operador) y la capa de servicios mock con su store de Zustand persistido.

Crea además una página `/dev/ui` con todos los componentes compartidos en sus variantes, para que yo valide el estilo antes de seguir.

## Fase 2 — Dashboard y Mis automatizaciones

Dashboard: seis métricas (bots registrados, activos, ejecuciones del día, exitosas, fallidas, tiempo ahorrado), gráficos de ejecuciones 7 días, tasa éxito/error, bots más usados y tiempo ahorrado por proceso; tabla de últimas ejecuciones con TanStack Table (orden, filtro por estado, paginación, acciones por fila). Botón "Crear automatización" siempre visible.

Mis automatizaciones: grilla de `BotCard` con vista alternativa en lista, búsqueda, filtros por estado/sistema/categoría y acciones crear, duplicar, editar, ejecutar, activar/desactivar y eliminar (con confirmación). Las acciones modifican el store y se reflejan en el dashboard.

## Fase 3 — Asistente de creación

Wizard en cuatro etapas con validación zod y navegación adelante/atrás conservando datos: información general; método (grabar o editor desde cero); configuración (navegador, URL destino, variables con tipo y valor por defecto, archivos de entrada); resumen y creación. Según el método elegido, termina en el grabador o en el editor del bot recién creado.

## Fase 4 — Grabador de interacciones (pausa al final)

Es pantalla núcleo. `RecorderToolbar` con nombre, indicador REC animado, cronómetro, iniciar, pausar, reanudar, detener y guardar. `BrowserSimulator` con barra de URL, atrás/adelante/recargar, y dentro una **aplicación de destino falsa pero navegable**: el "Sistema de trazabilidad operacional" con pantalla de login, menú, módulo de trazabilidad con selector de archivo, botón "Importar información" y mensaje de éxito.

Mientras se graba, cada interacción del usuario dentro de esa app falsa (clic, escritura, selección de archivo) se registra de verdad en el `ActionTimeline` lateral: tipo de acción, elemento, selector generado, hora y estado. Agrega también un botón "Reproducir grabación de ejemplo" que ejecuta el guion de 8 pasos automáticamente, para demos rápidas. Overlay que resalta el elemento sobre el que se actúa. En la línea de tiempo: editar, eliminar y reordenar con dnd-kit (también con teclado). Al guardar, los pasos se convierten en nodos del editor.

Muestra en algún lugar visible un aviso discreto de que es una simulación.

## Fase 5 — Editor visual

Es pantalla núcleo. Tres paneles redimensionables: `ActionLibrary` a la izquierda (categorías Navegación, Interacción, Archivos, Validaciones, Control de flujo; buscable; arrastrable al lienzo), `WorkflowCanvas` al centro con nodos custom por categoría (icono, color, estado, indicador de mantenimiento), minimapa, controles de zoom, auto-layout vertical y soporte de bifurcación para nodos de condición; `NodePropertiesPanel` a la derecha con formulario dinámico según el tipo de acción (nombre, selector, texto, URL, variables, timeout, reintentos, condiciones, captura esperada).

Barra superior: guardar (con indicador de cambios sin guardar), deshacer y rehacer (historial real en el store, con atajos), ejecutar, modo depuración (ejecución paso a paso resaltando el nodo activo en el lienzo), versiones y publicar versión (diálogo con nota de cambios). Eliminar nodo con tecla Supr y confirmación.

## Fase 6 — Ejecución, mantenimiento y versiones

Detalle de ejecución (pantalla núcleo): cabecera con proceso, versión, responsable, inicio, tiempo transcurrido y barra de progreso; lista de pasos con los cinco estados y animación de transición; `ExecutionConsole` con logs con timestamp y nivel, autoscroll y filtro; `ScreenshotViewer` con la captura simulada de cada paso (renderiza el estado de la app falsa del grabador, no imágenes externas); botón detener. El simulador recorre los nodos del bot con tiempos realistas y debe poder fallar de forma determinista en el escenario del caso de éxito.

Mantenimiento: lista de pasos afectados resaltados; para el seleccionado, selector anterior vs. elemento detectado, capturas lado a lado, alternativas encontradas con puntaje de confianza y selector propuesto. Acciones: probar selector (resultado simulado), reemplazar, volver a grabar solo ese paso (abre el grabador en ese punto), guardar nueva versión y restaurar versión anterior.

Versiones: línea de tiempo por bot con número, fecha, usuario, notas y estado de publicación; comparación entre dos versiones mostrando pasos agregados, eliminados y modificados; restaurar con confirmación.

## Fase 7 — Pantallas secundarias, pulido y prueba del recorrido

Historial de ejecuciones global, biblioteca de acciones (documentación de cada tipo), plantillas (crear bot desde plantilla), usuarios y permisos, configuración (incluye "Restablecer datos de demo") e integraciones. Ninguna puede quedar vacía ni con botones muertos, pero pueden ser más simples que las núcleo.

Revisa coherencia visual entre todas las pantallas, estados vacíos y de carga, responsive y modo oscuro. Por último, escribe un test de Playwright que recorra los siete pasos del criterio de éxito y déjalo pasando, y un `README.md` en español con cómo levantar el proyecto y el guion de la demo.
