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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0 12px', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)' }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function StadiumCard() {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--white)' }}>
      <div style={{ height: 170, position: 'relative', background: 'var(--black)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MURUBE_PHOTO} alt="Estadio Alfonso Murube" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.5) 100%)' }} />
      </div>
      <div style={{ padding: '18px 20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1, textTransform: 'uppercase' }}>Alfonso Murube</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>Ceuta · Inaugurado en 1944</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 16, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {STADIUM_FACTS.map((f, i) => (
            <div key={i} style={{ background: 'var(--white)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{f.num}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2 }}>{f.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PalmaresCard() {
  return (
    <div style={{ background: 'var(--black)', color: 'var(--white)', borderRadius: 14, padding: 22, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 90, background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.04) 7px 14px)' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14, position: 'relative' }}>Palmarés</div>
      {PALMARES.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, color: 'var(--gold)', minWidth: 34, lineHeight: 1 }}>{p.count}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.year}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Timeline() {
  return (
    <div style={{ position: 'relative', paddingLeft: 30 }}>
      <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
      {HISTORY.map((e, i) => (
        <div key={i} style={{ position: 'relative', paddingLeft: 28, paddingBottom: i === HISTORY.length - 1 ? 0 : 28 }}>
          {/* nodo */}
          <div style={{
            position: 'absolute', left: -21, top: 4, width: 14, height: 14, borderRadius: '50%',
            background: e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? 'var(--gold)' : 'var(--white)',
            border: `3px solid ${e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? 'var(--gold)' : 'var(--muted)'}`,
          }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, lineHeight: 1, color: e.tone === 'key' ? 'var(--red)' : e.tone === 'gold' ? '#B8930A' : 'var(--black)' }}>{e.year}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--black)', marginTop: 4 }}>{e.title}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted)', marginTop: 5, maxWidth: 540 }}>{e.desc}</div>
        </div>
      ))}
    </div>
  )
}

export function HistoriaTab() {
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', background: 'var(--black)', color: 'var(--white)', borderRadius: 14, overflow: 'hidden', marginTop: 16, padding: '56px 48px 52px', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* rayas diagonales */}
        <div style={{ position: 'absolute', top: 0, right: -60, bottom: 0, width: 520, background: 'repeating-linear-gradient(-45deg, white 0 16px, #0A0A0A 16px 32px)', clipPath: 'polygon(140px 0, 100% 0, 100% 100%, 0 100%)', opacity: 0.07, pointerEvents: 'none' }} />
        {/* año fantasma */}
        <div style={{ position: 'absolute', top: 6, right: 44, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 210, lineHeight: 0.8, color: 'rgba(255,255,255,0.05)', pointerEvents: 'none', letterSpacing: '-0.02em' }}>1956</div>
        {/* eyebrow */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div style={{ width: 24, height: 2, background: 'var(--red)', flexShrink: 0 }} />
          Orgullo caballa
        </div>
        {/* título */}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(38px, 5vw, 74px)', lineHeight: 0.92, letterSpacing: '-0.01em', marginTop: 12, textTransform: 'uppercase', position: 'relative', maxWidth: 660 }}>
          Más de un siglo de <em style={{ fontStyle: 'normal', color: 'var(--gold)' }}>fútbol</em> en Ceuta
        </div>
        {/* subtítulo */}
        <div style={{ marginTop: 16, maxWidth: 540, fontSize: 16, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', position: 'relative' }}>
          Del primer balón que rodó frente al Estrecho al debut en el fútbol profesional. Esta es la historia de la AD Ceuta.
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background: s.red ? 'var(--red)' : s.dark ? 'var(--black)' : 'var(--white)', border: `1px solid ${s.red ? 'var(--red)' : s.dark ? 'var(--black)' : 'var(--border)'}`, borderRadius: 14, padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 48, color: (s.red || s.dark) ? 'var(--white)' : 'var(--black)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: (s.red || s.dark) ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── LAYOUT: timeline + sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 36, alignItems: 'start', marginTop: 8 }}>
        {/* timeline */}
        <div>
          <SectionLabel>Cronología del club</SectionLabel>
          <Timeline />
        </div>

        {/* sidebar sticky */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 'calc(72px + 24px)' }}>
          <StadiumCard />
          <PalmaresCard />
        </div>
      </div>

      {/* ── IDENTIDAD ── */}
      <div style={{ marginTop: 40, background: 'var(--bg-soft)', borderRadius: 14, padding: '34px 36px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 34, alignItems: 'center' }}>
        <div style={{ width: 130, height: 130, background: 'var(--white)', border: '2px solid var(--black)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '5px 5px 0 var(--red)', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.png" alt="Escudo AD Ceuta" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)' }}>Identidad</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.01em', marginTop: 6, lineHeight: 1.02 }}>Caballas de corazón</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#444', marginTop: 12, maxWidth: 640 }}>
            La afición de la AD Ceuta es conocida como <strong style={{ color: 'var(--black)' }}>los caballas</strong>, gentilicio que toma su nombre del pez emblema de la ciudad. El escudo luce con orgullo los <strong style={{ color: 'var(--black)' }}>colores y símbolos de Ceuta</strong>, puente entre dos continentes. Cada partido en el Murube es una declaración de identidad: la de una ciudad que vive su fútbol con pasión fronteriza.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Los caballas', red: true },
              { label: 'Blanquinegros', dark: true },
              { label: '#AupaCeuta', red: false, dark: false },
              { label: 'Ciudad de Ceuta', red: false, dark: false },
            ].map((t, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', borderRadius: 999, background: t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--white)', border: `1.5px solid ${t.red ? 'var(--red)' : t.dark ? 'var(--black)' : 'var(--border)'}`, color: (t.red || t.dark) ? 'var(--white)' : 'var(--black)' }}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
