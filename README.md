# RPA Studio (NEXBOT)

Frontend de una plataforma para crear, grabar, editar, ejecutar y mantener bots de automatización web. **Prototipo con datos y servicios simulados**: no hay backend ni se controla ningún navegador real.

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
```

## Estructura

Ver [CLAUDE.md](CLAUDE.md) para el stack, la arquitectura y las reglas del proyecto, y [PROMPT_INICIAL_1.md](PROMPT_INICIAL_1.md) para el plan por fases.

La carpeta `video-automation-anywhere/` es un proyecto Remotion independiente (pieza publicitaria) y queda fuera del typecheck y lint de la app.
