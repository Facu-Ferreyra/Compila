# Uso de IA en el proyecto

> Declaración de cómo se usó inteligencia artificial para construir Compila. Se actualiza al cerrar cada paso de la hoja de ruta (`docs/ARQUITECTURA.md`, sección 9).

## Herramienta

- **Claude Code** (Anthropic) como tutor, configurado con `CLAUDE.md`: explica cada paso, propone código y comandos, y revisa lo que escribo. Por defecto no escribe el código; lo escribo y lo ejecuto yo.

## Qué hizo la IA y qué hice yo

| Paso | Lo escribí yo | Lo escribió la IA (a pedido explícito) |
|---|---|---|
| 0 | _(completar)_ | _(completar)_ |
| 1 | Tests y código de mina, plantarse, ronda perfecta y opción repetida | Tests y validaciones de ronda terminada, opción inexistente y plantarse sobre ronda terminada |
| Reordenamiento de la hoja de ruta | Los commits | Edición de `SPEC.md` (v0.4) y `ARQUITECTURA.md` (v0.2) según lo que acordamos |

## IA dentro del producto

- El panel de administración usa un LLM para generar **borradores** de rondas (SPEC 4.3). Ninguna ronda generada se aprueba sin revisión humana.
- El rival de Vs IA **no** es un LLM: es un bot con reglas (SPEC 5).
