'use client'

const DATOS = [
  { label: 'Fundación', value: '1923', sub: 'Club Atlético de Ceuta' },
  { label: 'Nombre actual', value: '2013', sub: 'AD Ceuta FC' },
  { label: 'Estadio', value: 'Murube', sub: 'Alfonso Murube · 8.500 plazas' },
  { label: 'Apodo', value: 'Caballas', sub: 'Por el pez emblema de la ciudad' },
]

const MOMENTOS = [
  {
    año: '1960',
    titulo: '2º en Segunda División',
    desc: 'El Club Atlético de Ceuta logra su mejor clasificación histórica: subcampeón de Segunda División, rozando el ascenso a Primera.',
    color: 'var(--red)',
  },
  {
    año: '2023',
    titulo: 'El Barça en el Murube',
    desc: 'El FC Barcelona visita el Alfonso Murube en octavos de Copa del Rey. Más de 7.000 caballas lo viven en directo.',
    color: 'var(--black)',
  },
  {
    año: '2025',
    titulo: 'Campeones y de vuelta a Segunda',
    desc: 'El 11 de mayo de 2025, Ceuta gana el grupo de Primera Federación y asciende de forma directa a Segunda División — 45 años después.',
    color: 'var(--red)',
  },
  {
    año: '2025',
    titulo: 'Debut en la Liga Hypermotion',
    desc: 'Temporada 2025-26: el AD Ceuta FC debuta en Segunda División ante los mejores equipos del fútbol español.',
    color: 'var(--black)',
  },
  {
    año: '2025',
    titulo: 'El femenino en la élite',
    desc: 'El AD Ceuta FC Femenino asciende a Primera División (Liga F), siendo el primer equipo femenino de la ciudad en alcanzar la élite nacional.',
    color: 'var(--red)',
  },
]

export function HistoriaTab() {
  return (
    <>
      {/* ── BLOQUE IDENTIDAD ── */}
      <div className="mx-3 mb-2 overflow-hidden rounded-[14px] bg-ceuta-black">
        <div className="px-5 pb-4 pt-5">
          <div className="mb-1 font-display text-[10px] font-bold uppercase tracking-widest text-white/40">
            AD Ceuta FC
          </div>
          <div className="font-display text-[32px] font-black uppercase leading-[0.95] text-white">
            Una ciudad,<br />
            <em className="not-italic text-ceuta-gold">un club</em>
          </div>
          <p className="mt-3 font-body text-[13px] leading-relaxed text-white/70">
            Nacido en 1923 en la ciudad autónoma de Ceuta, a orillas del Estrecho de Gibraltar, el AD Ceuta FC representa a una ciudad única: española en África. Tras décadas en categorías inferiores, el 11 de mayo de 2025 volvió al fútbol profesional — 45 años después.
          </p>
        </div>
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(to right, var(--red), var(--gold))' }}
        />
      </div>

      {/* ── DATOS CLAVE ── */}
      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        {DATOS.map((d, i) => (
          <div
            key={i}
            className={`flex min-h-[100px] flex-col justify-between rounded-[14px] p-4 ${
              i === 0 ? 'bg-ceuta-red' : i === 2 ? 'bg-ceuta-black' : 'bg-ceuta-bg-soft'
            }`}
          >
            <div
              className={`font-display text-[10px] font-bold uppercase tracking-widest ${
                i === 0 || i === 2 ? 'text-white/50' : 'text-ceuta-muted'
              }`}
            >
              {d.label}
            </div>
            <div>
              <div
                className={`font-display text-[22px] font-black leading-none ${
                  i === 0 || i === 2 ? 'text-white' : 'text-ceuta-black'
                }`}
              >
                {d.value}
              </div>
              <div
                className={`mt-1 font-display text-[9px] font-semibold uppercase tracking-wide ${
                  i === 0 || i === 2 ? 'text-white/60' : 'text-ceuta-muted'
                }`}
              >
                {d.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MASCOTA ── */}
      <div className="mx-3 mb-2 flex items-center gap-4 overflow-hidden rounded-[14px] bg-ceuta-bg-soft p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://elfarodeceuta.es/wp-content/uploads/2025/08/Caballati-AD-Ceuta-Sporting-Gijon-011.jpeg"
          alt="Caballati"
          className="size-[72px] shrink-0 rounded-[10px] object-cover object-top"
        />
        <div className="min-w-0">
          <div className="font-display text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">
            Mascota oficial
          </div>
          <div className="mt-0.5 font-display text-[20px] font-black text-ceuta-black">
            Caballati
          </div>
          <p className="mt-1 font-body text-[12px] leading-relaxed text-ceuta-muted">
            Inspirada en la caballa, el pez emblema de Ceuta y origen del apodo que llevan con orgullo sus aficionados.
          </p>
        </div>
      </div>

      {/* ── MOMENTOS MÍTICOS — timeline ── */}
      <div className="mx-3 mb-2">
        <div className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">
          Momentos históricos
        </div>
        <div className="relative flex flex-col gap-0">
          {/* línea vertical */}
          <div className="absolute bottom-0 left-[19px] top-0 w-[2px] bg-ceuta-border" />
          {MOMENTOS.map((m, i) => (
            <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
              {/* nodo */}
              <div
                className="relative z-[1] mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black text-white"
                style={{ background: m.color }}
              >
                {m.año.slice(2)}
              </div>
              <div className="min-w-0 flex-1 rounded-[12px] bg-ceuta-bg-soft p-3">
                <div className="mb-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
                  {m.año}
                </div>
                <div className="font-display text-[13px] font-black leading-snug text-ceuta-black">
                  {m.titulo}
                </div>
                <p className="mt-1 font-body text-[12px] leading-relaxed text-ceuta-muted">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
