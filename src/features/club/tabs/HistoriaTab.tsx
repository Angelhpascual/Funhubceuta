'use client'

import { Tile, TileValue, TileLabel } from '../components/ClubTiles'

const HISTORIA = [
  { label: 'Fundación', value: '1923', icon: '📅' },
  { label: 'Estadio', value: 'Alfonso Murube', icon: '🏟️' },
  { label: 'Capacidad', value: '8.500', icon: '👥' },
  { label: 'Ciudad', value: 'Ceuta', icon: '📍' },
  { label: 'Colores', value: 'Negro y blanco', icon: '🎨' },
  { label: 'Apodo', value: 'Caballas', icon: '🐟' },
]

const MOMENTOS = [
  {
    año: '1960',
    icono: '⭐',
    titulo: 'Segundos en Segunda División',
    desc: 'El Club Atlético de Ceuta logra su mejor clasificación histórica: segundo en Segunda División, rozando el ascenso a Primera.',
  },
  {
    año: '2023',
    icono: '🏟️',
    titulo: 'El Barça en el Murube',
    desc: 'El FC Barcelona de Lewandowski y Xavi visita el Alfonso Murube en octavos de Copa del Rey. Más de 7.000 caballas lo vivieron en directo.',
  },
  {
    año: '2025',
    icono: '🏆',
    titulo: 'Campeones y de vuelta a Segunda',
    desc: 'Ceuta gana el grupo de Primera Federación y asciende de forma directa a Segunda División el 11 de mayo de 2025, 45 años después.',
  },
  {
    año: '2025',
    icono: '⚽',
    titulo: 'Debut en la Liga Hypermotion',
    desc: 'Temporada 2025-26: la AD Ceuta FC debuta en la Liga Hypermotion (Segunda División) ante los mejores equipos del fútbol español.',
  },
  {
    año: '2025',
    icono: '👩',
    titulo: 'El femenino llega a la élite',
    desc: 'El AD Ceuta FC Femenino asciende a Primera División (Liga F), siendo el primer equipo femenino de la ciudad en alcanzar la élite nacional.',
  },
]

export function HistoriaTab() {
  return (
    <>
      {/* ── FOTO HERO MURUBE ── */}
      <div className="relative mx-3 mb-2 h-[200px] overflow-hidden rounded-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://elfarodeceuta.es/wp-content/uploads/2025/09/alfonso-murube-estadio-altura-futbol-profesional-7.jpg"
          alt="Estadio Alfonso Murube"
          className="size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="font-display text-[10px] font-bold uppercase tracking-widest text-white/60">
            Ceuta · España
          </div>
          <div className="font-display text-[24px] font-black uppercase leading-tight text-white">
            Estadio Alfonso <em className="not-italic text-ceuta-gold">Murube</em>
          </div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 px-3">
        {HISTORIA.map((h, i) => (
          <Tile
            key={i}
            className={`min-h-[90px] ${i === 0 ? 'bg-ceuta-red' : i === 1 ? 'bg-ceuta-black' : ''}`}
          >
            <div className="mb-1.5 text-[22px] leading-none">{h.icon}</div>
            <div>
              <TileValue className={`text-[18px] ${i <= 1 ? 'text-white' : 'text-ceuta-black'}`}>
                {h.value}
              </TileValue>
              <TileLabel className={i <= 1 ? 'text-white/75' : 'text-ceuta-muted'}>
                {h.label}
              </TileLabel>
            </div>
          </Tile>
        ))}
      </div>

      <div className="mx-3 mb-2 overflow-hidden rounded-[14px] bg-ceuta-bg-soft">
        <div className="relative h-[130px] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://elfarodeceuta.es/wp-content/uploads/2025/09/alfonso-murube-estadio-altura-futbol-profesional-1.jpg"
            alt="Interior del Murube"
            className="size-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ceuta-bg-soft" />
        </div>
        <div className="p-4 pt-2">
          <p className="mb-2.5 font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
            Nuestra historia
          </p>
          <p className="font-body text-[13px] leading-relaxed text-ceuta-black">
            Fundado en 1956 como Club Atlético de Ceuta, el club adoptó en 2013 el nombre y colores de
            la histórica AD Ceuta. Con sede en la ciudad autónoma de Ceuta, en el estrecho de
            Gibraltar, representa a una ciudad única: española en África.
          </p>
          <p className="mt-2.5 font-body text-[13px] leading-relaxed text-ceuta-black">
            Tras décadas en categorías inferiores, el 11 de mayo de 2025 lograron el ascenso a Segunda
            División — la Liga Hypermotion — 45 años después de la última vez que una entidad ceutí
            militó en el fútbol profesional español. Los Caballas son hoy una realidad en la élite.
          </p>
        </div>
      </div>

      <div className="mx-3 mb-2 flex items-center gap-4 rounded-[14px] bg-ceuta-red p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://elfarodeceuta.es/wp-content/uploads/2025/08/Caballati-AD-Ceuta-Sporting-Gijon-011.jpeg"
          alt="Caballati"
          className="size-20 shrink-0 rounded-xl object-cover object-top"
        />
        <div>
          <div className="font-display text-[20px] font-black text-white">Caballati</div>
          <div className="mb-2 font-display text-[9px] font-bold uppercase tracking-widest text-white/75">
            Mascota oficial
          </div>
          <p className="font-body text-[12px] leading-relaxed text-white/85">
            Caballati es la mascota oficial del AD Ceuta FC, inspirada en la caballa, el pez emblema
            de Ceuta y origen del apodo «Las Caballas» que llevan con orgullo sus aficionados.
          </p>
        </div>
      </div>

      <div className="mx-3 mb-2">
        <p className="mb-2 pl-1 font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
          Momentos míticos
        </p>
        <div className="flex flex-col gap-2">
          {MOMENTOS.map((m, i) => (
            <div key={i} className="flex items-start gap-3.5 rounded-[14px] bg-ceuta-bg-soft p-4">
              <div className="min-w-[36px] shrink-0 text-center">
                <div className="text-[24px] leading-none">{m.icono}</div>
                <div className="mt-1 font-display text-[10px] font-black tracking-wide text-ceuta-red">
                  {m.año}
                </div>
              </div>
              <div>
                <div className="mb-1 font-display text-[13px] font-black leading-snug text-ceuta-black">
                  {m.titulo}
                </div>
                <p className="font-body text-[12px] leading-relaxed text-ceuta-muted">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
