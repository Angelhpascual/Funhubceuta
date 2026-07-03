---
name: feedback_git_workflow
description: Git workflow — siempre feature branch → develop → main, nunca directo a main
metadata:
  type: feedback
---

Crear rama `feature/<nombre>` para cada tarea, mergear a `develop` para probar, y solo subir a `main` cuando el usuario lo pide explícitamente.

**Why:** El usuario quiere poder probar en develop antes de que llegue a producción. Varios cambios se hicieron directamente a main en sesiones anteriores saltándose develop.

**How to apply:** Antes de empezar cualquier tarea nueva, crear `feature/` desde `develop`. Mergear a `develop` al terminar. Preguntar antes de subir a `main`.
