# AD Ceuta FanHub — Sistema de Diseño v1.0

> Fuente de verdad oficial extraída del Sistema de Diseño AD Ceuta FanHub (Temporada 2025–26).
> **Toda nueva pantalla o componente debe seguir estas reglas.** No uses colores, tamaños ni estilos fuera de este sistema sin justificación explícita.

---

## Paleta de colores

Usa siempre las variables CSS — **nunca valores hexadecimales hardcodeados**.

### Colores de marca

| Variable       | Valor     | Uso                                                  |
|----------------|-----------|------------------------------------------------------|
| `--red`        | `#DA1A22` | Color primario. Acciones, acentos, victorias, play-off |
| `--red-dark`   | `#A8141B` | Estado hover / pressed del rojo                     |
| `--red-soft`   | `#FCE9EA` | Fila destacada del AD Ceuta en la tabla             |
| `--gold`       | `#F4C300` | **SOLO logros y ascenso directo. No decorativo.**   |
| `--gold-soft`  | `#FFF6CC` | Fondo suave de elementos dorados                    |
| `--black`      | `#0E0E0E` | Texto principal, superficies oscuras, descenso      |
| `--white`      | `#FFFFFF` | Lienzo de la app                                    |

### Neutros y superficies

| Variable       | Valor     | Uso                                      |
|----------------|-----------|------------------------------------------|
| `--bg`         | `#FFFFFF` | Fondo general de página                  |
| `--bone`       | `#F4F2EE` | Tarjetas suaves, fondos de sección       |
| `--bone-2`     | `#ECEAE4` | Bordes suaves, badges neutros            |
| `--muted`      | `#7A786F` | Texto secundario, metadatos              |
| `--muted-2`    | `#A8A69D` | Texto terciario                          |
| `--border`     | `#E6E3DD` | Separadores y bordes de tarjeta          |
| `--border-ink` | `#0E0E0E` | Bordes de énfasis                        |

### Variables semánticas (fútbol)

| Variable      | Color   | Significado               |
|---------------|---------|---------------------------|
| `--win`       | rojo    | Victoria                  |
| `--draw`      | gris    | Empate                    |
| `--loss`      | negro   | Derrota                   |
| `--promo`     | oro     | Ascenso directo           |
| `--playoff`   | rojo    | Play-off                  |
| `--relegation`| negro   | Descenso                  |

---

## Tipografía

Dos familias exclusivamente:
- **Barlow Condensed** — todo lo display (títulos, números, labels, chips). Siempre en mayúsculas.
- **Barlow** — texto corrido y datos densos.

| Variable          | Fuente           | Uso                                           |
|-------------------|------------------|-----------------------------------------------|
| `--font-display`  | Barlow Condensed | Títulos, números, labels, chips, eyebrows     |
| `--font-body`     | Barlow           | Párrafos de texto corrido                     |

### Jerarquía tipográfica

| Nombre       | Fuente               | Tamaño | Weight | Notas                              |
|--------------|----------------------|--------|--------|------------------------------------|
| Display XL   | Barlow Condensed     | 56px   | 900    | Uppercase                          |
| Display L    | Barlow Condensed     | 40px   | 800    | Uppercase                          |
| Título       | Barlow Condensed     | 28px   | 800    | `.sec-title`                       |
| Encabezado   | Barlow Condensed     | 20px   | 700    |                                    |
| Eyebrow      | Barlow Condensed     | 12px   | 700    | Uppercase, tracking 0.18em. `.sec-title-small` |
| Cuerpo       | Barlow               | 16px   | 400    |                                    |
| Small / meta | Barlow               | 13px   | 500    |                                    |

---

## Espaciado

Escala base de **4px**. Márgenes de pantalla: 12–16px.

| Variable | Valor |
|----------|-------|
| `--s-1`  | 4px   |
| `--s-2`  | 8px   |
| `--s-3`  | 12px  |
| `--s-4`  | 16px  |
| `--s-5`  | 20px  |
| `--s-6`  | 24px  |
| `--s-8`  | 32px  |
| `--s-10` | 40px  |
| `--s-12` | 48px  |

---

## Radios

| Variable    | Valor | Uso                          |
|-------------|-------|------------------------------|
| `--r-sm`    | 8px   | Botones, thumbnails          |
| `--r-md`    | 14px  | Tarjetas                     |
| `--r-lg`    | 18px  | Contenedores grandes         |
| `--r-pill`  | 999px | Chips, avatares              |

---

## Sombras

| Variable        | Valor                          | Uso                          |
|-----------------|--------------------------------|------------------------------|
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.04)`  | Tarjetas sutiles             |
| `--shadow-pop`  | `0 12px 40px rgba(0,0,0,0.10)`| Modales, elementos flotantes |
| `--shadow-hard` | `6px 6px 0 var(--red)`        | Tarjeta destacada AD Ceuta   |

---

## Componentes

### Botones y chips

- Etiquetas siempre en **Barlow Condensed, mayúsculas, con tracking**.
- **Rojo** = acción principal. **Negro** = acción secundaria fuerte.
- Clases: `chip`, `chip active`, `match-cta`

```html
<!-- Chip activo -->
<button class="chip active">Resultados</button>
<!-- Chip inactivo -->
<button class="chip">Próximos</button>
```

### Cabeceras de sección

Patrón firma de la app: eyebrow rojo en mayúsculas + título condensado grande.

```html
<div class="sec-header">
  <div>
    <div class="sec-title-small">Temporada 2025–26</div>
    <div class="sec-title">Clasificación</div>
  </div>
</div>
```

### Stat tiles

Grid de 2 columnas con clase `stats-grid`. Variantes: neutro (blanco), `red`, `dark`.

```html
<div class="stats-grid">
  <div class="stat-tile">...</div>
  <div class="stat-tile red">...</div>
  <div class="stat-tile dark">...</div>
</div>
```

### Indicador de forma (Últimos 5)

**Siempre usar iniciales en castellano:**
- **V** (victoria) → fondo negro
- **E** (empate) → fondo gris (`--muted`)
- **D** (derrota) → fondo rojo

**Nunca usar W/L/D en inglés.**

### Badge de resultado

Mismo criterio que el indicador de forma:
- `.badge-w` → negro (Victoria = **V**)
- `.badge-d` → gris (Empate = **E**)
- `.badge-l` → rojo (Derrota = **D**)

### Navegación inferior

Barra fija de 4 destinos: Inicio, Clasificación, Partidos, Club.
La pestaña activa: icono/etiqueta en negro + **indicador rojo centrado pegado al borde superior** (como hijo del `.nav-item` con `position: relative`, no flotando).

---

## Nomenclatura del club

**Fijar un único nombre oficial:**
- ✅ **AD Ceuta FC** — cabeceras y fichas
- ✅ **AD Ceuta** — tablas y resultados
- ❌ Evitar: «Imperio AD Ceuta FC», «Imperio-AD Ceuta», mezclas con/sin «FC»

---

## Patrones visuales

- **Franjas diagonales** sobre superficies oscuras (6% opacidad) — cabeceras
- **Patrón ajedrezado** — inspirado en el escudo, solo en cabeceras

---

## Auditoría de diseño (pendiente de resolver)

| # | Prioridad | Problema | Fix |
|---|-----------|----------|-----|
| 1 | ~~Alta~~ ✅ | Nombre del club inconsistente | Usar `AD Ceuta FC` / `AD Ceuta` |
| 2 | Alta | Indicador rojo de la nav «flotando» | `position:absolute; top:0` dentro de `.nav-item{position:relative}` |
| 3 | Alta | Empty state «Próximos partidos» sin diseño | Empty state real con escudo atenuado + mensaje en condensada |
| 4 | ~~Alta~~ ✅ | Forma reciente mezcla V/E/D con W/L | Corregido: V negro · E gris · D rojo |
| 5 | Media | El oro tiene dos significados (logro + partido título) | Reservar oro solo para logros/ascenso |
| 6 | Media | Resalte de fila AD Ceuta vs barra de play-off | Borde izquierdo grueso o fondo neutro en vez de rojo suave |
| 7 | Media | Truncado de nombres a mitad de palabra | Nombres cortos oficiales en tablas, 2 líneas con elipsis |
| 8 | Baja | Contraste de metadatos | Oscurecer `--muted` a ~`#6B6960` para texto <13px |
| 9 | Baja | Barra superior solo muestra escudo | Opcional: escudo + «AD CEUTA» en condensada |
| 10 | Baja | Bordes de resultado sin leyenda | Decidir si son redundantes con el badge o se mantienen |
