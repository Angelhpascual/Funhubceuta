# FunHub Ceuta — Design System

Este documento define el lenguaje visual de la app. **Toda nueva pantalla o componente debe seguir estas reglas.** No uses colores, tamaños ni estilos fuera de este sistema sin justificación explícita.

---

## Paleta de colores

Usa siempre las variables CSS — nunca valores hexadecimales hardcodeados.

| Variable         | Valor     | Uso                                          |
|------------------|-----------|----------------------------------------------|
| `--red`          | `#D62027` | Acento principal, CTA, datos destacados      |
| `--red-dark`     | `#A8161C` | Hover/pressed sobre rojo                     |
| `--red-soft`     | `#FFE9EA` | Fondo sutil de fila activa (clasificación)   |
| `--black`        | `#0A0A0A` | Texto principal, cards oscuras               |
| `--white`        | `#FFFFFF` | Fondo de cards, topbar, bottom nav           |
| `--bg`           | `#FFFFFF` | Fondo general de página                      |
| `--bg-soft`      | `#F5F4F1` | Fondo de cards neutras, secciones suaves     |
| `--bg-mid`       | `#ECEAE4` | Separadores, numerales de dorsal             |
| `--muted`        | `#6E6E6E` | Texto secundario, labels, subtítulos         |
| `--border`       | `#E4E1DA` | Bordes sutiles entre filas                   |
| `--border-strong`| `#0A0A0A` | Bordes de énfasis (clas-mine-card)           |
| `--gold`         | `#F2C300` | Zona ascenso directo en clasificación        |

---

## Tipografía

| Variable          | Fuente              | Uso                                         |
|-------------------|---------------------|---------------------------------------------|
| `--font-display`  | Barlow Condensed    | Todos los títulos, números, labels, chips   |
| `--font-body`     | Barlow              | Párrafos de texto corrido                   |

### Jerarquía de tamaños (display)
- **Hero / posición**: 54px, weight 900, tracking -0.02em
- **Números grandes**: 38–42px, weight 900
- **Títulos de sección** (`.sec-title`): 22px, weight 800
- **Nombres de jugador/equipo**: 14–16px, weight 700
- **Labels / chips / eyebrows**: 9–11px, weight 700, uppercase, tracking 0.1em

---

## Componentes CSS reutilizables

### Stat tiles — el patrón más usado en Club y Estadísticas

```html
<!-- Tile neutro (fondo blanco, borde sutil) -->
<div class="stat-tile">
  <div class="stat-value">42</div>
  <div class="stat-label">Partidos jugados</div>
</div>

<!-- Tile rojo (datos destacados, posición) -->
<div class="stat-tile red">…</div>

<!-- Tile negro (puntos, dark mode) -->
<div class="stat-tile dark">…</div>
```

Grid estándar de 2 columnas:
```html
<div class="stats-grid">…</div>
```

### Section headers
```html
<div class="sec-header">
  <div>
    <div class="sec-title-small">Subtítulo rojo</div>
    <div class="sec-title">Título principal</div>
  </div>
</div>
```

### Chips / filtros de pestaña
```html
<div class="chips">
  <button class="chip active">Activo</button>
  <button class="chip">Inactivo</button>
</div>
```

### Collapses de grupo (Plantilla)
- Fondo del header: `#e8e8e8` → se corresponde con `var(--bg-soft)` visualmente
- Texto: `var(--black)`, weight 800, uppercase
- Acento izquierdo: barra de 3px `var(--red)`
- Interior expandido: `var(--bg-soft)`

### Form pills
```html
<div class="form-pill W">W</div>  <!-- rojo -->
<div class="form-pill D">D</div>  <!-- muted -->
<div class="form-pill L">L</div>  <!-- negro -->
```

---

## Estructura de páginas

Todas las páginas siguen el mismo patrón:

```
<div class="page">                        ← animación fadeIn
  <div class="clas-hero-eyebrow">…</div>  ← eyebrow rojo con raya
  <h1 style="font-display 26px black">…</h1>
  <div class="chips">…</div>             ← tabs de la sección
  … contenido …
</div>
```

### Reglas de layout
- Padding horizontal de páginas: `0 12px`
- Gap entre cards: `8px`
- Border radius de cards: `var(--radius)` = 14px
- Margen inferior de secciones: `8px`

---

## Reglas de diseño

1. **No uses `#e8e8e8` ni colores hex directos** — usa las variables CSS del sistema.
2. **No uses fondo negro en elementos nuevos** salvo para tiles `.dark` o cards de estadísticas donde el contraste sea deliberado.
3. **El rojo es acento, no fondo principal** — úsalo en el primer tile hero, CTAs, y detalles de énfasis.
4. **Las cards neutras** usan `.stat-tile` (fondo blanco, borde `var(--border)`).
5. **Los labels siempre en uppercase** con `letter-spacing: 0.1em` mínimo.
6. **No mezcles inline styles con clases CSS** cuando ya exista la clase equivalente.
7. **Consistencia entre pestañas**: si un patrón visual existe en Clasificación o Inicio, réplícalo en las demás páginas en lugar de inventar uno nuevo.
