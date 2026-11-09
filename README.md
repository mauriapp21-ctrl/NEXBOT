# RPA Studio (NEXBOT)

Frontend de una plataforma para crear, grabar, editar, ejecutar y mantener bots de automatización web. Los datos son de demostración. Los bots de la planta usan un **motor simulado**; los bots que apuntan a sitios web reales usan el **motor real local** (Playwright + tu Google Chrome).

## Requisitos

- Node 20 o superior
- pnpm

## Comandos

```bash
pnpm install     # instalar dependencias
pnpm dev         # servidor de desarrollo en http://localhost:3000
pnpm typecheck   # verificación de tipos
pnpm lint        # ESLint
pnpm build       # build de producción
pnpm engine      # motor real local (opcional, en otra terminal)
```

## Motor real local

1. Requiere Google Chrome instalado.
2. En una segunda terminal: `pnpm engine` (escucha en `http://127.0.0.1:4319`, solo este equipo).
3. En la app, el indicador de la barra lateral cambia a **Motor real conectado**.
4. Crea un bot con **Crear automatización → Usar datos de ejemplo → Formulario web de prueba**, grábalo en Chrome y ejecútalo.
5. Los archivos que el bot adjunta deben estar en `engine/files/` (incluye `Documento_Prueba.txt`).

Las contraseñas escritas durante una grabación no se guardan: el paso usa la variable secreta `{{clave_sitio}}`, cuyo valor se define en el bot.

## Estructura

Ver [CLAUDE.md](CLAUDE.md) para el stack, la arquitectura y las reglas del proyecto, y [PROMPT_INICIAL_1.md](PROMPT_INICIAL_1.md) para el plan por fases.

La carpeta `video-automation-anywhere/` es un proyecto Remotion independiente (pieza publicitaria) y queda fuera del typecheck y lint de la app.
