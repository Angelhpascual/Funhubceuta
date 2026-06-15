'use client'

const HISTORY = [
  { year: '2012', title: 'Nace la AD Ceuta FC', desc: 'El fútbol de la ciudad se reorganiza y echa a andar la Asociación Deportiva Ceuta FC, heredera de la tradición caballa.', tone: 'key' },
  { year: '2014', title: 'Primeros pasos en categoría nacional', desc: 'El club se asienta en las divisiones de bronce del fútbol español y empieza a forjar una afición fiel.', tone: '' },
  { year: '2019', title: 'Reforma del Alfonso Murube', desc: 'El estadio se moderniza para acoger una afición cada vez más numerosa en las noches grandes del fútbol.', tone: '' },
  { year: '2021', title: 'Salto a Primera RFEF', desc: 'La AD Ceuta accede a la nueva tercera categoría del fútbol nacional y se mide a clubes históricos.', tone: '' },
  { year: '2023', title: 'Mejor temporada de su historia', desc: 'El equipo roza el play-off y firma registros de récord como local en el Murube.', tone: '' },
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
  { value: '2012', label: 'Fundación', dark: false, red: true },
  { value: '2025', label: 'Ascenso a 2ª', dark: true, red: false },
  { value: '6.500', label: 'Aforo Murube', dark: false, red: false },
  { value: '⚫⚪', label: 'Blanquinegros', dark: false, red: false },
]

const MURUBE_PHOTO = 'https://upload.wikimedia.org/wikipedia/commons/2/2a/6092c97fa861df960efb2efd_Estadio-Murube-1.jpg'

const TAGS = [
  { label: 'Los caballas', red: true, dark: false },
  { label: 'Blanquinegros', red: false, dark: true },
  { label: '#AupaCeuta', red: false, dark: false },
  { label: 'Ciudad de Ceuta', red: false, dark: false },
]

function MLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="hist-label">
      {children}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function StadiumCard() {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--white)' }}>
      <div className="hist-stadium-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MURUBE_PHOTO} alt="Estadio Alfonso Murube" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.5) 100%)' }} />
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1, textTransform: 'uppercase' }}>Alfonso Murube</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Ceuta · Inaugurado en 1944</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 14, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {STADIUM_FACTS.map((f, i) => (
            <div key={i} style={{ background: 'var(--white)', padding: '11px 13px' }}>
              <div className="hist-fact-num">{f.num}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2 }}>{f.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PalmaresCard() {
  return (
    <div style={{ background: 'var(--black)', color: 'var(--white)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 70, background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.04) 7px 14px)' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, position: 'relative' }}>Títulos y logros</div>
      {PALMARES.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <div className="hist-pal-count">{p.count}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.year}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Timeline() {
  return (
    <div className="hist-timeline">
      <div className="hist-tl-line" />
      {HISTORY.map((e, i) => (
        <div key={i} className="hist-tl-item" style={{ paddingBottom: i === HISTORY.length - 1 ? 0 : undefined }}>
          <div className="hist-tl-dot" style={{
            background: e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? 'var(--gold)' : 'var(--white)',
            borderColor: e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? 'var(--gold)' : 'var(--muted)',
          }} />
          <div className="hist-tl-year" style={{ color: e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? '#B8930A' : 'var(--black)' }}>{e.year}</div>
          <div className="hist-tl-title">{e.title}</div>
          <div className="hist-tl-desc">{e.desc}</div>
        </div>
      ))}
    </div>
  )
}

export function HistoriaTab() {
  return (
    <>
      <style>{`
        /* ── HISTORIA TAB RESPONSIVE ── */
        .hist-hero {
          position: relative;
          background: var(--black);
          color: var(--white);
          border-radius: 14px;
          overflow: hidden;
          margin-top: 16px;
          padding: 30px 20px 26px;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .hist-hero-stripes {
          position: absolute;
          top: 0; right: -30px; bottom: 0;
          width: 230px;
          background: repeating-linear-gradient(-45deg, white 0 12px, #0A0A0A 12px 24px);
          clip-path: polygon(70px 0, 100% 0, 100% 100%, 0 100%);
          opacity: 0.07;
          pointer-events: none;
        }
        .hist-hero-ghost {
          position: absolute;
          top: -6px; right: 14px;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 120px;
          line-height: 0.8;
          color: rgba(255,255,255,0.05);
          pointer-events: none;
          letter-spacing: -0.02em;
        }
        .hist-hero-eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        .hist-hero-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 40px;
          line-height: 0.95;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          margin-top: 10px;
          position: relative;
        }
        .hist-hero-sub {
          margin-top: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255,255,255,0.72);
          position: relative;
        }

        .hist-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 16px 0 0;
        }
        .hist-stat {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          background: var(--white);
        }
        .hist-stat-value {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 34px;
          line-height: 1;
          color: var(--black);
        }
        .hist-stat-label {
          font-family: var(--font-display);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 6px;
        }

        .hist-label {
          padding: 14px 0 8px;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hist-timeline {
          position: relative;
          padding-left: 30px;
        }
        .hist-tl-line {
          position: absolute;
          left: 6px; top: 8px; bottom: 8px;
          width: 2px;
          background: var(--border);
        }
        .hist-tl-item {
          position: relative;
          padding-left: 18px;
          padding-bottom: 22px;
        }
        .hist-tl-dot {
          position: absolute;
          left: -23px; top: 3px;
          width: 12px; height: 12px;
          border-radius: 50%;
          border: 3px solid;
        }
        .hist-tl-year {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 22px;
          line-height: 1;
        }
        .hist-tl-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin-top: 3px;
          color: var(--black);
        }
        .hist-tl-desc {
          font-size: 13px;
          line-height: 1.45;
          color: var(--muted);
          margin-top: 4px;
        }

        .hist-stadium-photo {
          height: 140px;
          position: relative;
          background: var(--black);
        }

        .hist-fact-num {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
        }

        .hist-pal-count {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 24px;
          color: var(--gold);
          min-width: 30px;
          line-height: 1;
        }

        .hist-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 0;
        }
        .hist-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .hist-identity {
          margin-top: 18px;
          background: var(--bg-soft);
          border-radius: 14px;
          padding: 24px 20px;
          text-align: center;
        }
        .hist-identity-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hist-identity-crest {
          width: 96px; height: 96px;
          background: var(--white);
          border: 2px solid var(--black);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 4px 4px 0 var(--red);
          flex-shrink: 0;
        }
        .hist-identity-text-col {
          margin-top: 16px;
          text-align: center;
        }
        .hist-identity-eyebrow {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--red);
        }
        .hist-identity-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 24px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .hist-identity-body {
          font-size: 13.5px;
          line-height: 1.55;
          color: #444;
          margin-top: 10px;
          max-width: 560px;
        }
        .hist-tags {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 14px;
        }

        /* ── DESKTOP overrides ── */
        @media (min-width: 768px) {
          .hist-hero {
            padding: 56px 48px 52px;
            min-height: 280px;
          }
          .hist-hero-stripes {
            right: -60px;
            width: 520px;
            background: repeating-linear-gradient(-45deg, white 0 16px, #0A0A0A 16px 32px);
            clip-path: polygon(140px 0, 100% 0, 100% 100%, 0 100%);
          }
          .hist-hero-ghost { font-size: 210px; right: 44px; }
          .hist-hero-eyebrow { font-size: 12.5px; gap: 10px; }
          .hist-hero-title { font-size: clamp(38px, 5vw, 74px); margin-top: 12px; max-width: 660px; }
          .hist-hero-sub { font-size: 16px; max-width: 540px; margin-top: 16px; }

          .hist-stats {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            padding-top: 20px;
          }
          .hist-stat { padding: 22px; }
          .hist-stat-value { font-size: 48px; }
          .hist-stat-label { font-size: 12px; margin-top: 8px; letter-spacing: 0.12em; }

          .hist-label { padding: 24px 0 12px; font-size: 11px; }

          .hist-tl-year { font-size: 26px; }
          .hist-tl-title { font-size: 17px; }
          .hist-tl-desc { font-size: 14px; max-width: 540px; margin-top: 5px; }
          .hist-tl-item { padding-bottom: 28px; }

          .hist-stadium-photo { height: 170px; }
          .hist-fact-num { font-size: 20px; }
          .hist-pal-count { font-size: 26px; min-width: 34px; }

          .hist-layout {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 36px;
            align-items: start;
            margin-top: 8px;
          }
          .hist-sidebar {
            position: sticky;
            top: calc(72px + 24px);
            gap: 20px;
            margin-top: 0;
          }

          .hist-identity {
            margin-top: 40px;
            padding: 34px 36px;
            text-align: left;
          }
          .hist-identity-inner {
            flex-direction: row;
            align-items: center;
            gap: 34px;
          }
          .hist-identity-crest {
            width: 130px; height: 130px;
          }
          .hist-identity-text-col {
            margin-top: 0;
            text-align: left;
          }
          .hist-identity-eyebrow { font-size: 12px; }
          .hist-identity-title { font-size: 30px; line-height: 1.02; }
          .hist-identity-body { font-size: 15px; }
          .hist-tags { justify-content: flex-start; }
        }
      `}</style>

      <div style={{ paddingBottom: 40 }}>
        {/* ── HERO ── */}
        <div className="hist-hero">
          <div className="hist-hero-stripes" />
          <div className="hist-hero-ghost">1956</div>
          <div className="hist-hero-eyebrow">
            <div style={{ width: 18, height: 2, background: 'var(--red)', flexShrink: 0 }} />
            Orgullo caballa
          </div>
          <div className="hist-hero-title">
            Más de un siglo de <em style={{ fontStyle: 'normal', color: 'var(--gold)' }}>fútbol</em> en Ceuta
          </div>
          <div className="hist-hero-sub">
            Del primer balón que rodó frente al Estrecho al debut en el fútbol profesional. Esta es la historia de la AD Ceuta.
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="hist-stats">
          {STATS.map((s, i) => (
            <div key={i} className="hist-stat" style={{ background: s.red ? 'var(--red)' : s.dark ? 'var(--black)' : 'var(--white)', borderColor: s.red ? 'var(--red)' : s.dark ? 'var(--black)' : 'var(--border)' }}>
              <div className="hist-stat-value" style={{ color: (s.red || s.dark) ? 'var(--white)' : 'var(--black)' }}>{s.value}</div>
              <div className="hist-stat-label" style={{ color: (s.red || s.dark) ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── LAYOUT: timeline + sidebar ── */}
        <div className="hist-layout">
          {/* timeline */}
          <div>
            <MLabel>Cronología del club</MLabel>
            <Timeline />
          </div>

          {/* sidebar */}
          <div className="hist-sidebar">
            <MLabel>El estadio</MLabel>
            <StadiumCard />
            <MLabel>Palmarés</MLabel>
            <PalmaresCard />
          </div>
        </div>

        {/* ── IDENTIDAD ── */}
        <div className="hist-identity">
          <div className="hist-identity-inner">
            <div className="hist-identity-crest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/escudo.png" alt="Escudo AD Ceuta" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
            </div>
            <div className="hist-identity-text-col">
              <div className="hist-identity-eyebrow">Identidad</div>
              <div className="hist-identity-title">Caballas de corazón</div>
              <div className="hist-identity-body">
                La afición de la AD Ceuta es conocida como <strong style={{ color: 'var(--black)' }}>los caballas</strong>, gentilicio que toma su nombre del pez emblema de la ciudad. El escudo luce con orgullo los <strong style={{ color: 'var(--black)' }}>colores y símbolos de Ceuta</strong>, puente entre dos continentes. Cada partido en el Murube es una declaración de identidad.
              </div>
              <div className="hist-tags">
                {TAGS.map((t, i) => (
                  <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999, background: t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--white)', border: `1.5px solid ${t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--border)'}`, color: (t.red || t.dark) ? 'var(--white)' : 'var(--black)' }}>{t.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
