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
  { label: 'Apodo', value: 'Las Caballas', icon: '🐟' },
]

const PALMARES = [
  { titulo: 'Subcampeón Copa del Rey', año: '1951' },
  { titulo: '3ª División — Campeón', año: '2017' },
  { titulo: 'Segunda División — Debut', año: '2021' },
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


function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sec-header">
      <div>
        {sub && <div className="sec-title-small">{sub}</div>}
        <div className="sec-title">{title}</div>
      </div>
    </div>
  )
}

const CDN = 'https://assets.laliga.com/squad/2025/t14705'

const LEADERS_GOALS = [
  { name: 'Marcos', value: 13, photo: `${CDN}/p604116/256x256/p604116_t14705_2025_1_003_000.png` },
  { name: 'Zalazar', value: 6, photo: `${CDN}/p179371/256x256/p179371_t14705_2025_1_003_000.png` },
  { name: 'Rubén Díez', value: 5, photo: `${CDN}/p464496/256x256/p464496_t14705_2025_1_003_000.png` },
  { name: 'Matos', value: 4, photo: `${CDN}/p603604/256x256/p603604_t14705_2025_1_003_000.png` },
  { name: 'Konrad', value: 3, photo: `${CDN}/p432753/256x256/p432753_t14705_2025_1_003_000.png` },
]

const LEADERS_ASSISTS = [
  { name: 'Zalazar', value: 4, photo: `${CDN}/p179371/256x256/p179371_t14705_2025_1_003_000.png` },
  { name: 'Koné', value: 4, photo: `${CDN}/p213838/256x256/p213838_t14705_2025_1_003_000.png` },
  { name: 'Marino', value: 3, photo: `${CDN}/p484783/256x256/p484783_t14705_2025_1_003_000.png` },
  { name: 'Matos', value: 2, photo: `${CDN}/p603604/256x256/p603604_t14705_2025_1_003_000.png` },
  { name: 'Youness', value: 2, photo: `${CDN}/p207724/256x256/p207724_t14705_2025_1_003_000.png` },
]

const LEADERS_SHOTS = [
  { name: 'Marcos', value: 31, photo: `${CDN}/p604116/256x256/p604116_t14705_2025_1_003_000.png` },
  { name: 'Zalazar', value: 16, photo: `${CDN}/p179371/256x256/p179371_t14705_2025_1_003_000.png` },
  { name: 'Matos', value: 13, photo: `${CDN}/p603604/256x256/p603604_t14705_2025_1_003_000.png` },
  { name: 'Konrad', value: 13, photo: `${CDN}/p432753/256x256/p432753_t14705_2025_1_003_000.png` },
  { name: 'Carlos Hdez.', value: 10, photo: `${CDN}/p95677/256x256/p95677_t14705_2025_1_003_000.png` },
]

function StatLeaderSection({ title, icon, leaders, max }: {
  title: string
  icon: string
  leaders: { name: string; value: number; photo: string }[]
  max: number
}) {
  return (
    <div style={{ margin: '0 12px 12px', background: 'var(--black)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--white)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {leaders.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: i === 0 ? 'var(--red)' : 'var(--muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.photo} alt={l.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, border: i === 0 ? '2px solid var(--red)' : '2px solid transparent' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
              <div style={{ marginTop: 4, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((l.value / max) * 100)}%`, background: i === 0 ? 'var(--red)' : 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: i === 0 ? 'var(--white)' : 'var(--muted)', flexShrink: 0 }}>{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollapsibleStaff() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--black)', border: 'none', padding: '12px 16px',
          borderRadius: open ? '10px 10px 0 0' : 'var(--radius)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, background: 'var(--red)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--white)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Cuerpo técnico
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {STAFF.length} miembros
          </span>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div style={{ background: 'var(--bg-soft)', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {STAFF.map((s, i) => (
            <div key={i} className="player-row" style={{ borderRadius: 0, borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photo} alt={s.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
              <div className="player-info">
                <div className="player-name" style={{ fontSize: 13 }}>{s.name}</div>
                <div className="player-pos">{s.role}</div>
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
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--black)', border: 'none', padding: '12px 16px',
          borderRadius: open ? '10px 10px 0 0' : 'var(--radius)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, background: 'var(--red)', borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--white)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {group}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {players.length} jugadores
          </span>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div style={{ background: 'var(--bg-soft)', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {players.map((p, i) => (
            <div key={i} className="player-row" style={{ borderRadius: 0, borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="player-num">{p.dorsal ?? '—'}</div>
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={p.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
              ) : (
                <div className="player-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>{initials(p.name)}</div>
              )}
              <div className="player-info">
                <div className="player-name" style={{ fontSize: 13 }}>{p.name}</div>
                <div className="player-pos">{capitalize(p.position)}</div>
              </div>
              <div style={{ fontSize: 16 }}>{flag(p.nationality)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ClubPage() {
  const [tab, setTab] = useState("stats");
  const [grouped, setGrouped] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ceuta, setCeuta] = useState<StandingEntry | null>(null);

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
  }, [])

  const winPct = ceuta ? Math.round((ceuta.won / ceuta.played) * 100) : 0

  return (
    <div className="page">
      <div className="sec-header" style={{ paddingTop: 20 }}>
        <div>
          <div className="sec-title-small">Temporada 2025–26</div>
          <div className="sec-title">AD Ceuta FC</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 12 }}>
        {[
          { id: 'stats', l: 'Temporada' },
          { id: 'plantilla', l: 'Plantilla' },
          { id: 'historia', l: 'Historia' },
        ].map(t => (
          <button key={t.id} className={`chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── TEMPORADA ── */}
      {tab === 'stats' && (
        <>
          {/* Hero card: posición + puntos */}
          <div style={{ margin: '0 12px 10px', background: 'var(--black)', borderRadius: 'var(--radius)', padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 120, color: 'rgba(255,255,255,0.03)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              {ceuta?.position ?? '—'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Segunda División · 2025–26</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 64, color: 'var(--red)', lineHeight: 1 }}>
                  {ceuta ? `${ceuta.position}º` : '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Clasificación</div>
              </div>
              <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.08)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 64, color: 'var(--white)', lineHeight: 1 }}>
                  {ceuta?.points ?? '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Puntos</div>
              </div>
            </div>
          </div>

          {/* Fila compacta J/V/E/D */}
          <div style={{ display: 'flex', gap: 6, padding: '0 12px', marginBottom: 10 }}>
            {[
              { v: ceuta?.played, l: 'J' },
              { v: ceuta?.won, l: 'V' },
              { v: ceuta?.drawn, l: 'E' },
              { v: ceuta?.lost, l: 'D' },
            ].map(({ v, l }) => (
              <div key={l} style={{ flex: 1, background: 'var(--black)', borderRadius: 10, padding: '10px 0', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--white)', lineHeight: 1 }}>{v ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Goles en una sola fila */}
          <div style={{ margin: '0 12px 16px', background: 'var(--black)', borderRadius: 'var(--radius)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--white)' }}>{ceuta?.goalsFor ?? '—'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GF</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>·</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--red)' }}>{ceuta?.goalsAgainst ?? '—'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>GC</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>·</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: ceuta && ceuta.goalDifference >= 0 ? 'var(--white)' : 'var(--red)' }}>
                {ceuta ? (ceuta.goalDifference > 0 ? `+${ceuta.goalDifference}` : ceuta.goalDifference) : '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>DG</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--white)' }}>{winPct}%</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Victorias</div>
            </div>
          </div>

          {/* Líderes: Goleadores */}
          <StatLeaderSection title="Goleadores" icon="⚽" leaders={LEADERS_GOALS} max={13} />

          {/* Líderes: Asistencias */}
          <StatLeaderSection title="Asistencias" icon="🎯" leaders={LEADERS_ASSISTS} max={4} />

          {/* Líderes: Disparos */}
          <StatLeaderSection title="Disparos" icon="🥊" leaders={LEADERS_SHOTS} max={31} />
        </>
      )}

      {/* ── PLANTILLA ── */}
      {tab === 'plantilla' && (
        <>
          {/* Cuerpo técnico colapsable */}
          <div style={{ padding: '0 12px', marginBottom: 4 }}>
            <CollapsibleStaff />
          </div>

          {/* Jugadores */}
          <div style={{ padding: '0 12px 6px', fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Jugadores · {total} · toca para expandir
          </div>
          {loading ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Cargando plantilla…
            </div>
          ) : (
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
          <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {HISTORIA.map((h, i) => (
              <div key={i} style={{ background: 'var(--black)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{h.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--white)' }}>{h.value}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Texto historia */}
          <div style={{ margin: '0 12px 8px', background: 'var(--black)', borderRadius: 'var(--radius)', padding: '18px 16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--white)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              🖤 Nuestra historia
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              La AD Ceuta FC nació en 1923 en la ciudad autónoma de Ceuta, en el estrecho de Gibraltar.
              Durante décadas fue un referente del fútbol del sur de España, con una afición conocida
              por su fervor y pasión.
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 10 }}>
              En 2021, el club logró el histórico ascenso a Segunda División, debutando por primera
              vez en la categoría de plata del fútbol español. Las Caballas, apodo cariñoso de los
              ceutíes, representan a una ciudad única en el mundo: española en África.
            </div>
          </div>

          {/* Palmarés */}
          <SectionHeader title="Palmarés" sub="Historia" />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {PALMARES.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--black)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🏆</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--white)' }}>{p.titulo}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--red)' }}>{p.año}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
