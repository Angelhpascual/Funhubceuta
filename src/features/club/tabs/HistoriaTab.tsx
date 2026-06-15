'use client'

import Image from 'next/image'

const HISTORY = [
  { year: '2012', title: 'Nace la AD Ceuta FC', desc: 'El fútbol de la ciudad se reorganiza y echa a andar la Asociación Deportiva Ceuta FC, heredera de la tradición caballa.', tone: 'key' },
  { year: '2014', title: 'Primeros pasos en categoría nacional', desc: 'El club se asienta en las divisiones de bronce del fútbol español y empieza a forjar una afición fiel.' },
  { year: '2019', title: 'Reforma del Alfonso Murube', desc: 'El estadio se moderniza para acoger una afición cada vez más numerosa en las noches grandes del fútbol.' },
  { year: '2021', title: 'Salto a Primera RFEF', desc: 'La AD Ceuta accede a la nueva tercera categoría del fútbol nacional y se mide a clubes históricos.' },
  { year: '2023', title: 'Mejor temporada de su historia', desc: 'El equipo roza el play-off y firma registros de récord como local en el Murube.' },
  { year: '2025', title: 'Ascenso histórico a Segunda División', desc: 'Tras una temporada inolvidable, la AD Ceuta sella su primer ascenso al fútbol profesional. La ciudad se vuelca.', tone: 'gold' },
  { year: '2026', title: 'Debut en el fútbol profesional', desc: 'El club afronta su primera campaña en Segunda División, escribiendo una nueva página de su historia.', tone: 'key' },
]

const PALMARES = [
  { count: '1', name: 'Ascenso a Segunda División', year: '2025' },
  { count: '2', name: 'Ascensos de categoría', year: '2014 · 2021' },
  { count: '1', name: 'Campeón de grupo', year: '2021' },
]

const STADIUM_FACTS = [
  { num: '6.500', lbl: 'Aforo' },
  { num: '105×68', lbl: 'Dimensiones (m)' },
  { num: 'Natural', lbl: 'Césped' },
  { num: '1944', lbl: 'Inauguración' },
]

const STATS = [
  { value: '2012', label: 'Fundación', variant: 'red' },
  { value: '2025', label: 'Ascenso a 2ª', variant: 'dark' },
  { value: '6.500', label: 'Aforo Murube', variant: '' },
  { value: '⚫⚪', label: 'Blanquinegros', variant: '' },
]

const STADIUM_PHOTO = 'https://upload.wikimedia.org/wikipedia/commons/2/2a/6092c97fa861df960efb2efd_Estadio-Murube-1.jpg'

function Timeline({ mobile }: { mobile?: boolean }) {
  return (
    <div className={mobile ? 'hist-timeline-mobile' : 'hist-timeline'}>
      {HISTORY.map((e, i) => (
        <div key={i} className={`hist-tl-event ${e.tone ?? ''}`}>
          <div className="hist-tl-year">{e.year}</div>
          <div className="hist-tl-title">{e.title}</div>
          <div className="hist-tl-desc">{e.desc}</div>
        </div>
      ))}
    </div>
  )
}

function StadiumCard() {
  return (
    <div className="hist-stadium-card">
      <div className="hist-stadium-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={STADIUM_PHOTO}
          alt="Estadio Alfonso Murube"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div className="hist-stadium-overlay" />
      </div>
      <div className="hist-stadium-body">
        <div className="hist-stadium-name">Alfonso Murube</div>
        <div className="hist-stadium-loc">Ceuta · Inaugurado en 1944</div>
        <div className="hist-stadium-facts">
          {STADIUM_FACTS.map((f, i) => (
            <div key={i} className="hist-stadium-fact">
              <div className="hist-sf-num">{f.num}</div>
              <div className="hist-sf-lbl">{f.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PalmaresCard() {
  return (
    <div className="hist-palmares-card">
      <div className="hist-palmares-title">Palmarés</div>
      {PALMARES.map((p, i) => (
        <div key={i} className="hist-palmares-item">
          <div className="hist-palmares-count">{p.count}</div>
          <div>
            <div className="hist-palmares-name">{p.name}</div>
            <div className="hist-palmares-year">{p.year}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HistoriaTab() {
  return (
    <div className="hist-root">
      {/* ── HERO ── */}
      <div className="hist-hero">
        <div className="hist-hero-stripes" />
        <div className="hist-year-ghost">1956</div>
        <div className="hist-hero-eyebrow">Orgullo caballa</div>
        <div className="hist-hero-title">
          Más de un siglo de <em>fútbol</em> en Ceuta
        </div>
        <div className="hist-hero-sub">
          Del primer balón que rodó frente al Estrecho al debut en el fútbol profesional. Esta es la historia de la AD Ceuta.
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="hist-stats-grid">
        {STATS.map((s, i) => (
          <div key={i} className={`hist-stat-tile ${s.variant}`}>
            <div className="hist-stat-value">{s.value}</div>
            <div className="hist-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: 2 columnas / MOBILE: 1 columna ── */}
      <div className="hist-layout">
        {/* columna principal: timeline */}
        <div className="hist-main">
          <div className="hist-section-label">Cronología del club</div>
          <Timeline />
        </div>

        {/* sidebar: estadio + palmarés */}
        <div className="hist-side">
          <StadiumCard />
          <PalmaresCard />
        </div>
      </div>

      {/* ── IDENTIDAD ── */}
      <div className="hist-identity">
        <div className="hist-identity-crest">
          <Image src="/escudo.png" alt="Escudo AD Ceuta" width={78} height={78} />
        </div>
        <div className="hist-identity-body">
          <div className="hist-identity-eyebrow">Identidad</div>
          <div className="hist-identity-title">Caballas de corazón</div>
          <div className="hist-identity-text">
            La afición de la AD Ceuta es conocida como <strong>los caballas</strong>, gentilicio que toma su nombre del pez emblema de la ciudad. El escudo luce con orgullo los <strong>colores y símbolos de Ceuta</strong>, puente entre dos continentes. Cada partido en el Murube es una declaración de identidad: la de una ciudad que vive su fútbol con pasión fronteriza.
          </div>
          <div className="hist-identity-tags">
            <span className="hist-tag red">Los caballas</span>
            <span className="hist-tag black">Blanquinegros</span>
            <span className="hist-tag">#AupaCeuta</span>
            <span className="hist-tag">Ciudad de Ceuta</span>
          </div>
        </div>
      </div>
    </div>
  )
}
