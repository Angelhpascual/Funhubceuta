'use client'

const HISTORY = [
  {
    year: '1956',
    title: 'Fundación del Club',
    desc: 'El 9 de julio de 1956 nace el Club Atlético de Ceuta, fruto de la fusión entre la S.D. Ceuta y los elementos españoles del Atlético de Tetuán. Arranca directamente en Segunda División.',
    tone: 'key',
  },
  {
    year: '1960',
    title: 'Mejor clasificación histórica en 2ª',
    desc: 'El club termina subcampeón de Segunda División en la temporada 1960–61 y disputa una promoción de ascenso a Primera División, cayendo ante el Elche CF.',
    tone: '',
  },
  {
    year: '1968',
    title: 'Descenso y años en tercera',
    desc: 'Tras once temporadas en segunda, el club baja y oscila durante décadas entre Tercera División y Segunda B, consolidándose como referente del fútbol ceutí.',
    tone: '',
  },
  {
    year: '2013',
    title: 'Refundación como AD Ceuta FC',
    desc: 'Tras la desaparición de la AD Ceuta por deudas en 2012, el club se reorganiza y adopta en 2013 el nombre Agrupación Deportiva Ceuta FC, heredando colores, escudo y afición.',
    tone: 'key',
  },
  {
    year: '2021',
    title: 'Ascenso a Segunda RFEF',
    desc: 'En la final del play-off, un gol de Misfutt en el minuto 89 frena al Xerez CD y da a Ceuta el ascenso a Segunda RFEF (4ª categoría nacional).',
    tone: '',
  },
  {
    year: '2022',
    title: 'Salto a Primera Federación',
    desc: 'Un año después, el equipo vuelve a ganar el play-off —2–0 ante Navalcarnero— y sube a Primera Federación (3ª categoría). Temporada histórica en Copa del Rey: eliminan a Ibiza y al Elche antes de caer 5–0 ante el FC Barcelona.',
    tone: '',
  },
  {
    year: '2025',
    title: 'Ascenso a Segunda División',
    desc: 'El 11 de mayo de 2025, Ceuta gana 1–2 en Fuenlabrada y regresa al fútbol profesional 57 años después. La ciudad celebra el mayor hito de su historia deportiva.',
    tone: 'gold',
  },
  {
    year: '2026',
    title: 'Primera temporada en Segunda División',
    desc: 'La AD Ceuta FC debuta en LaLiga Hypermotion y afronta su primer campeonato entre los profesionales, con el Estadio Alfonso Murube como fortín y la afición caballa volcada.',
    tone: 'key',
  },
]


const STADIUM_FACTS = [
  { num: '6.500', lbl: 'Aforo' },
  { num: '105×68', lbl: 'Dimensiones (m)' },
  { num: 'Natural', lbl: 'Césped' },
  { num: '1944', lbl: 'Inauguración' },
]

const TAGS = [
  { label: 'Los caballas', red: true, dark: false },
  { label: 'Blanquinegros', red: false, dark: true },
  { label: '#AupaCeuta', red: false, dark: false },
  { label: 'Ceuta · España', red: false, dark: false },
]

const MURUBE_PHOTO = '/api/proxy/image?url=' + encodeURIComponent('https://elfarodeceuta.es/wp-content/uploads/2025/09/alfonso-murube-estadio-altura-futbol-profesional-1.jpg')

function MLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="hist-label">
      {children}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function IdentityBlock() {
  return (
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
            La afición de la AD Ceuta es conocida como <strong style={{ color: 'var(--black)' }}>los caballas</strong>, gentilicio que toma su nombre del pez emblema de la ciudad. El escudo luce los <strong style={{ color: 'var(--black)' }}>colores blanquinegros</strong> y los símbolos de la ciudad autónoma. Con raíces en <strong style={{ color: 'var(--black)' }}>1956</strong>, el club disputa sus partidos en el <strong style={{ color: 'var(--black)' }}>Estadio Alfonso Murube</strong> y en 2025 selló el mayor hito de su historia: el ascenso a <strong style={{ color: 'var(--black)' }}>Segunda División</strong> tras 57 años sin categoría profesional.
          </div>
          <div className="hist-tags">
            {TAGS.map((t, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999, background: t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--white)', border: `1.5px solid ${t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--border)'}`, color: (t.red || t.dark) ? 'var(--white)' : 'var(--black)' }}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>
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
        .hist-root {
          padding: 0 16px 40px;
        }
        @media (min-width: 768px) {
          .hist-root { padding: 0 0 40px; }
        }
        .hist-hero {
          position: relative;
          background: var(--black);
          color: var(--white);
          border-radius: 14px;
          overflow: hidden;
          margin: 16px 0 0;
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

        /* identity: mobile = soft bg card, full width */
        .hist-identity {
          margin-top: 16px;
          background: var(--bg-soft);
          border-radius: 14px;
          padding: 20px;
        }
        .hist-identity-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hist-identity-crest {
          width: 80px; height: 80px;
          background: var(--white);
          border: 2px solid var(--black);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 3px 3px 0 var(--red);
          flex-shrink: 0;
        }
        .hist-identity-text-col {
          margin-top: 14px;
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
          font-size: 22px;
          text-transform: uppercase;
          margin-top: 4px;
          line-height: 1.1;
        }
        .hist-identity-body {
          font-size: 13px;
          line-height: 1.55;
          color: #444;
          margin-top: 10px;
        }
        .hist-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 12px;
        }

        /* ── DESKTOP overrides ── */
        @media (min-width: 768px) {
          .hist-hero {
            padding: 56px 48px 52px;
            min-height: 280px;
            margin-top: 16px;
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

          .hist-label { padding: 24px 0 12px; }

          .hist-tl-year { font-size: 26px; }
          .hist-tl-title { font-size: 17px; }
          .hist-tl-desc { font-size: 14px; max-width: 540px; margin-top: 5px; }
          .hist-tl-item { padding-bottom: 28px; }

          .hist-stadium-photo { height: 220px; }
          .hist-fact-num { font-size: 20px; }

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

          /* identity: desktop = horizontal row */
          .hist-identity {
            margin-top: 40px;
            padding: 34px 36px;
          }
          .hist-identity-inner {
            flex-direction: row;
            align-items: center;
            gap: 34px;
            text-align: left;
          }
          .hist-identity-crest {
            width: 130px; height: 130px;
            border-radius: 14px;
            box-shadow: 5px 5px 0 var(--red);
          }
          .hist-identity-text-col { margin-top: 0; }
          .hist-identity-eyebrow { font-size: 12px; }
          .hist-identity-title { font-size: 30px; line-height: 1.02; }
          .hist-identity-body { font-size: 15px; max-width: 640px; }
          .hist-tags { justify-content: flex-start; }
        }
      `}</style>

      <div className="hist-root">
        {/* ── HERO ── */}
        <div className="hist-hero">
          <div className="hist-hero-stripes" />
          <div className="hist-hero-ghost">1956</div>
          <div className="hist-hero-eyebrow">
            <div style={{ width: 18, height: 2, background: 'var(--red)', flexShrink: 0 }} />
            Orgullo caballa
          </div>
          <div className="hist-hero-title">
            70 años de <em style={{ fontStyle: 'normal', color: 'var(--gold)' }}>fútbol</em> en Ceuta
          </div>
          <div className="hist-hero-sub">
            Del primer balón que rodó frente al Estrecho al debut en el fútbol profesional. Esta es la historia de la AD Ceuta.
          </div>
        </div>

        {/* ── IDENTIDAD (justo después del hero) ── */}
        <IdentityBlock />

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
          </div>
        </div>
      </div>
    </>
  )
}
