"use client";

import { useState, useEffect } from "react";
import { StandingEntry } from "@/domain/standings/Standings";

interface Player {
  dorsal: number | null
  name: string
  position: string
  position_group: string
  nationality: string
  photo_url: string | null
}

interface Group {
  group: string
  players: Player[]
}

const NAT_FLAGS: Record<string, string> = {
  España: '🇪🇸', Mali: '🇲🇱', Senegal: '🇸🇳', Guinea: '🇬🇳', Bisau: '🇬🇼',
  Argentina: '🇦🇷', Uruguay: '🇺🇾', Colombia: '🇨🇴', Francia: '🇫🇷',
  Marruecos: '🇲🇦', Argelia: '🇩🇿', Camerún: '🇨🇲', Brasil: '🇧🇷',
}

const STAFF = [
  { name: 'José Juan Romero', role: 'Entrenador', photo: 'https://assets.laliga.com/squad/2025/t14705/man53081/512x512/man53081_t14705_2025_1_003_000.png' },
  { name: 'Antonio José Sánchez', role: 'Segundo entrenador', photo: 'https://assets.laliga.com/squad/2025/t14705/man67065/512x512/man67065_t14705_2025_1_003_000.png' },
]

const HISTORIA = [
  { label: 'Fundación', value: '1923', icon: '📅' },
  { label: 'Estadio', value: 'Alfonso Murube', icon: '🏟️' },
  { label: 'Capacidad', value: '8.500', icon: '👥' },
  { label: 'Ciudad', value: 'Ceuta', icon: '📍' },
  { label: 'Colores', value: 'Negro y blanco', icon: '🎨' },
  { label: 'Apodo', value: 'Caballas', icon: '🐟' },
]

const MOMENTOS = [
  { año: '1960', icono: '⭐', titulo: 'Segundos en Segunda División', desc: 'El Club Atlético de Ceuta logra su mejor clasificación histórica: segundo en Segunda División, rozando el ascenso a Primera.' },
  { año: '2023', icono: '🏟️', titulo: 'El Barça en el Murube', desc: 'El FC Barcelona de Lewandowski y Xavi visita el Alfonso Murube en octavos de Copa del Rey. Más de 7.000 caballas lo vivieron en directo.' },
  { año: '2025', icono: '🏆', titulo: 'Campeones y de vuelta a Segunda', desc: 'Ceuta gana el grupo de Primera Federación y asciende de forma directa a Segunda División el 11 de mayo de 2025, 45 años después.' },
  { año: '2025', icono: '⚽', titulo: 'Debut en la Liga Hypermotion', desc: 'Temporada 2025-26: la AD Ceuta FC debuta en la Liga Hypermotion (Segunda División) ante los mejores equipos del fútbol español.' },
  { año: '2025', icono: '👩', titulo: 'El femenino llega a la élite', desc: 'El AD Ceuta FC Femenino asciende a Primera División (Liga F), siendo el primer equipo femenino de la ciudad en alcanzar la élite nacional.' },
]

function flag(nationality: string): string {
  for (const [key, emoji] of Object.entries(NAT_FLAGS)) {
    if (nationality.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🏴'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface Leader { name: string; value: number; photo: string }
interface LeaderCategory { label: string; icon: string; leaders: Leader[] }
type LeadersMap = Record<string, LeaderCategory>

function StatLeaderSection({ title, icon, leaders, max }: {
  title: string
  icon: string
  leaders: Leader[]
  max: number
}) {
  return (
    <div className="mx-3 mb-2 rounded-[14px] bg-ceuta-bg-soft p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[13px]">{icon}</span>
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {leaders.map((l, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className={`w-3.5 shrink-0 font-display text-[11px] font-black ${i === 0 ? 'text-ceuta-red' : 'text-ceuta-muted'}`}>{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.photo} alt={l.name}
              className={`size-8 shrink-0 rounded-full object-cover object-top ${i === 0 ? 'outline outline-2 outline-ceuta-red outline-offset-1' : ''}`}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[12px] font-bold text-ceuta-black">{l.name}</div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-sm bg-black/10">
                <div
                  className={`h-full rounded-sm ${i === 0 ? 'bg-ceuta-red' : 'bg-black/25'}`}
                  style={{ width: `${Math.round((l.value / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className={`shrink-0 font-display text-[18px] font-black ${i === 0 ? 'text-ceuta-black' : 'text-ceuta-muted'}`}>{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollapsibleStaff() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between bg-ceuta-bg-soft px-4 py-3 ${open ? 'rounded-t-[10px]' : 'rounded-[10px]'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-[3px] rounded-sm bg-ceuta-red" />
          <span className="font-display text-[12px] font-extrabold uppercase tracking-widest text-ceuta-black">Cuerpo técnico</span>
          <span className="font-display text-[10px] tracking-wide text-ceuta-muted">{STAFF.length} miembros</span>
        </div>
        <span className={`text-[14px] text-ceuta-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="overflow-hidden rounded-b-[10px] bg-ceuta-bg-soft">
          {STAFF.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ceuta-border' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photo} alt={s.name} className="size-[38px] shrink-0 rounded-full object-cover object-top" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] font-bold uppercase tracking-wide text-ceuta-black">{s.name}</div>
                <div className="text-[12px] text-ceuta-muted">{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsibleGroup({ group, players, defaultOpen }: { group: string; players: Player[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between bg-ceuta-bg-soft px-4 py-3 ${open ? 'rounded-t-[10px]' : 'rounded-[10px]'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-[3px] rounded-sm bg-ceuta-red" />
          <span className="font-display text-[12px] font-extrabold uppercase tracking-widest text-ceuta-black">{group}</span>
          <span className="font-display text-[10px] tracking-wide text-ceuta-muted">{players.length} jugadores</span>
        </div>
        <span className={`text-[14px] text-ceuta-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="overflow-hidden rounded-b-[10px] bg-ceuta-bg-soft">
          {players.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ceuta-border' : ''}`}>
              <div className="min-w-[32px] text-center font-display text-[22px] font-black text-ceuta-bg-mid">{p.dorsal ?? '—'}</div>
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={p.name} className="size-[38px] shrink-0 rounded-full object-cover object-top" />
              ) : (
                <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-ceuta-bg-mid font-display text-[12px] font-extrabold text-ceuta-muted">{initials(p.name)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] font-bold uppercase tracking-wide text-ceuta-black">{p.name}</div>
                <div className="text-[12px] text-ceuta-muted">{capitalize(p.position)}</div>
              </div>
              <div className="text-[16px]">{flag(p.nationality)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tile base reutilizable
function Tile({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-h-[100px] flex-col justify-between rounded-[14px] p-4 bg-ceuta-bg-soft ${className}`}>
      {children}
    </div>
  )
}

function TileValue({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`font-display font-black leading-none tracking-tight ${className}`}>{children}</div>
}

function TileLabel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mt-2 font-display text-[9px] font-bold uppercase tracking-widest ${className}`}>{children}</div>
}

export function ClubPage() {
  const [tab, setTab] = useState("stats");
  const [grouped, setGrouped] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ceuta, setCeuta] = useState<StandingEntry | null>(null);
  const [form, setForm] = useState<string[]>([]);
  const [leaders, setLeaders] = useState<LeadersMap | null>(null);

  useEffect(() => {
    fetch('/api/squad')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.grouped) setGrouped(d.grouped)
        if (d?.total) setTotal(d.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/standings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.entries) {
          const c = d.entries.find((e: StandingEntry) => e.teamName.toLowerCase().includes('ceuta'))
          if (c) setCeuta(c)
        }
      })
      .catch(() => {})

    fetch('/api/matches/results')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.form) setForm(d.form) })
      .catch(() => {})

    fetch('/api/stats/player-leaders')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.leaders) setLeaders(d.leaders) })
      .catch(() => {})
  }, [])

  function getZoneLabel(pos: number): string {
    if (pos <= 2) return 'Ascenso directo'
    if (pos <= 6) return 'Zona play-off'
    if (pos >= 19) return 'Zona descenso'
    return 'Zona media'
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="clas-hero-eyebrow px-4 pb-1.5 pt-5">Temporada 2025–26</div>
      <h1 className="font-display px-4 pb-3.5 text-[26px] font-black uppercase tracking-tight text-ceuta-black">
        AD CEUTA FC
      </h1>

      {/* Tabs */}
      <div className="chips mb-3">
        {[
          { id: 'stats', l: 'Estadísticas' },
          { id: 'plantilla', l: 'Plantilla' },
          { id: 'historia', l: 'Historia' },
        ].map(t => (
          <button key={t.id} className={`chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── ESTADÍSTICAS ── */}
      {tab === 'stats' && (
        <>
          {/* Hero: posición + puntos */}
          <div className="mb-2 grid grid-cols-2 gap-2 px-3">
            <Tile className="min-h-[110px] bg-ceuta-red">
              <TileValue className="text-[54px] text-white">
                {ceuta?.position ?? '—'}<span className="align-super text-[22px]">º</span>
              </TileValue>
              <TileLabel className="text-white/75">{ceuta ? getZoneLabel(ceuta.position) : 'Clasificación'}</TileLabel>
            </Tile>
            <Tile className="min-h-[110px] bg-ceuta-black">
              <TileValue className="text-[54px] text-white">{ceuta?.points ?? '—'}</TileValue>
              <TileLabel className="text-white/75">Puntos</TileLabel>
            </Tile>
          </div>

          {/* Stats grid */}
          <div className="mb-2 grid grid-cols-2 gap-2 px-3">
            {[
              { v: ceuta?.played,       l: 'Partidos jugados' },
              { v: ceuta?.won,          l: 'Victorias' },
              { v: ceuta?.drawn,        l: 'Empates' },
              { v: ceuta?.lost,         l: 'Derrotas' },
              { v: ceuta?.goalsFor,     l: 'Goles a favor' },
              { v: ceuta?.goalsAgainst, l: 'Goles en contra' },
              {
                v: ceuta ? (ceuta.goalDifference > 0 ? `+${ceuta.goalDifference}` : ceuta.goalDifference) : '—',
                l: 'Diferencia de goles',
              },
            ].map(({ v, l }) => (
              <Tile key={l}>
                <TileValue className="text-[42px] text-ceuta-black">{v ?? '—'}</TileValue>
                <TileLabel className="text-ceuta-muted">{l}</TileLabel>
              </Tile>
            ))}
            {form.length > 0 && (
              <Tile>
                <div className="flex flex-wrap gap-1">
                  {form.slice(-5).map((f, i) => <div key={i} className={`form-pill ${f}`}>{f}</div>)}
                </div>
                <TileLabel className="text-ceuta-muted">Últimos 5</TileLabel>
              </Tile>
            )}
          </div>

          {/* Líderes */}
          {leaders ? (
            ['appearances', 'goals', 'assists', 'shots', 'shots_on_target', 'saves', 'yellow_cards', 'red_cards']
              .map(key => leaders[key])
              .filter(Boolean)
              .map(cat => (
                <StatLeaderSection key={cat.label} title={cat.label} icon={cat.icon} leaders={cat.leaders} max={cat.leaders[0]?.value ?? 1} />
              ))
          ) : (
            <p className="mx-3 py-6 text-center font-display text-[10px] uppercase tracking-widest text-ceuta-muted">
              Cargando estadísticas…
            </p>
          )}
        </>
      )}

      {/* ── PLANTILLA ── */}
      {tab === 'plantilla' && (
        <>
          <div className="px-3 mb-1">
            <CollapsibleStaff />
          </div>
          <p className="px-3 pb-1.5 font-display text-[10px] uppercase tracking-widest text-ceuta-muted">
            Jugadores · {total} · toca para expandir
          </p>
          {loading ? (
            <p className="py-8 text-center font-display text-[11px] uppercase tracking-widest text-ceuta-muted">
              Cargando plantilla…
            </p>
          ) : (
            <div className="flex flex-col gap-1 px-3">
              {grouped.map((g, i) => (
                <CollapsibleGroup key={g.group} group={g.group} players={g.players} defaultOpen={i === 0} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORIA ── */}
      {tab === 'historia' && (
        <>
          {/* Datos básicos */}
          <div className="mb-2 grid grid-cols-2 gap-2 px-3">
            {HISTORIA.map((h, i) => (
              <Tile
                key={i}
                className={`min-h-[90px] ${i === 0 ? 'bg-ceuta-red' : i === 1 ? 'bg-ceuta-black' : ''}`}
              >
                <div className="mb-1.5 text-[22px] leading-none">{h.icon}</div>
                <div>
                  <TileValue className={`text-[18px] ${i <= 1 ? 'text-white' : 'text-ceuta-black'}`}>{h.value}</TileValue>
                  <TileLabel className={i <= 1 ? 'text-white/75' : 'text-ceuta-muted'}>{h.label}</TileLabel>
                </div>
              </Tile>
            ))}
          </div>

          {/* Texto historia */}
          <div className="mx-3 mb-2 rounded-[14px] bg-ceuta-bg-soft p-4">
            <p className="mb-2.5 font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">Nuestra historia</p>
            <p className="font-body text-[13px] leading-relaxed text-ceuta-black">
              Fundado en 1956 como Club Atlético de Ceuta, el club adoptó en 2013 el nombre y colores
              de la histórica AD Ceuta. Con sede en la ciudad autónoma de Ceuta, en el estrecho de
              Gibraltar, representa a una ciudad única: española en África.
            </p>
            <p className="mt-2.5 font-body text-[13px] leading-relaxed text-ceuta-black">
              Tras décadas en categorías inferiores, el 11 de mayo de 2025 lograron el ascenso a
              Segunda División — la Liga Hypermotion — 45 años después de la última vez que una
              entidad ceutí militó en el fútbol profesional español. Los Caballas son hoy una
              realidad en la élite.
            </p>
          </div>

          {/* Mascota */}
          <div className="mx-3 mb-2 flex items-center gap-4 rounded-[14px] bg-ceuta-red p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://elfarodeceuta.es/wp-content/uploads/2025/08/Caballati-AD-Ceuta-Sporting-Gijon-011.jpeg"
              alt="Caballati"
              className="size-20 shrink-0 rounded-xl object-cover object-top"
            />
            <div>
              <div className="font-display text-[20px] font-black text-white">Caballati</div>
              <div className="mb-2 font-display text-[9px] font-bold uppercase tracking-widest text-white/75">Mascota oficial</div>
              <p className="font-body text-[12px] leading-relaxed text-white/85">
                Caballati es la mascota oficial del AD Ceuta FC, inspirada en la caballa, el pez emblema de Ceuta y origen del apodo «Las Caballas» que llevan con orgullo sus aficionados.
              </p>
            </div>
          </div>

          {/* Momentos míticos */}
          <div className="mx-3 mb-2">
            <p className="mb-2 pl-1 font-display text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">Momentos míticos</p>
            <div className="flex flex-col gap-2">
              {MOMENTOS.map((m, i) => (
                <div key={i} className="flex items-start gap-3.5 rounded-[14px] bg-ceuta-bg-soft p-4">
                  <div className="min-w-[36px] shrink-0 text-center">
                    <div className="text-[24px] leading-none">{m.icono}</div>
                    <div className="mt-1 font-display text-[10px] font-black tracking-wide text-ceuta-red">{m.año}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-display text-[13px] font-black leading-snug text-ceuta-black">{m.titulo}</div>
                    <p className="font-body text-[12px] leading-relaxed text-ceuta-muted">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="h-2" />
    </div>
  );
}
