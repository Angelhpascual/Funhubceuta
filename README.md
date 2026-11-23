# AD Ceuta Info

**Web: [adceutainfo.com](https://www.adceutainfo.com)**

Aplicación web (PWA) para la afición del **AD Ceuta FC**: partidos, clasificación, plantilla, noticias, alineaciones, mercado, predicciones, modo directo y alertas push. Proyecto de aficionado, sin relación oficial con el club.

> Desarrollada con un flujo asistido por IA (Claude Code) y revisión humana de cada cambio. Las reglas del proyecto están en `AGENTS.md` y `DESIGN.md`.

## Qué incluye

- **Partidos y clasificación** de la temporada, con detalle de cada jornada.
- **Plantilla y jugadores**, con estadísticas y fotos.
- **Modo directo:** seguimiento del partido en vivo y alertas push al usuario.
- **Noticias** agregadas desde feeds públicos.
- **Alineación, mercado, predicciones y merchandising.**
- **Calendario** exportable (`.ics`) para añadir los partidos al móvil.
- **Panel de administración** para gestionar contenido y avisos.
- **Lighthouse (móvil):** Accesibilidad 96 · Buenas prácticas 100 · SEO 100.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase · Web Push · QStash (tareas programadas) · Vitest · Vercel

## Arquitectura

Código organizado por capas, con el dominio separado de la infraestructura:

```
src/
  app/             rutas, páginas y API (cron, push, partidos, noticias...)
  domain/          entidades y reglas (partidos, clasificación, noticias, predicciones)
  infrastructure/  acceso a datos: Supabase, scrapers, RSS, push, almacenamiento
  features/        pantallas por funcionalidad (home, club, partidos, admin...)
  components/      UI reutilizable bajo un sistema de diseño propio (DESIGN.md)
```

Las tareas periódicas (actualizar partidos, noticias, estadísticas, avisos antes del partido) se ejecutan como rutas `cron` que se lanzan desde un planificador.

## Tests

Más de un centenar de archivos de test con **Vitest**, que cubren el dominio, las rutas de API y las utilidades.

```bash
pnpm install
pnpm test            # ejecutar los tests
pnpm test:coverage   # con cobertura
pnpm dev             # servidor de desarrollo en http://localhost:3000
```

Para ejecutarla en local hacen falta credenciales de Supabase y de notificaciones push, que no se incluyen en el repositorio.

## Estado

En producción en [adceutainfo.com](https://www.adceutainfo.com) y en evolución continua durante la temporada.
