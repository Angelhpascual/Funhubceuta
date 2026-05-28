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
  { name: 'David Álvarez "Polaco"', role: 'Entrenador', emoji: '🧠' },
  { name: 'Alejandro Pascual', role: 'Segundo entrenador', emoji: '📋' },
  { name: 'José María Calleja', role: 'Preparador físico', emoji: '💪' },
  { name: 'Aitor Unzueta', role: 'Entrenador de porteros', emoji: '🧤' },
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

function StatTile({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'var(--red)' : 'var(--black)',
      borderRadius: 'var(--radius)',
      padding: '14px 12px',
      textAlign: 'center',
      flex: 1,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, color: 'var(--white)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: accent ? 'rgba(255,255,255,0.7)' : 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
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
          {/* Big stats */}
          <div style={{ display: 'flex', gap: 8, padding: '0 12px', marginBottom: 8 }}>
            <StatTile value={ceuta ? `${ceuta.position}º` : '—'} label="Posición" accent />
            <StatTile value={ceuta?.points ?? '—'} label="Puntos" />
            <StatTile value={ceuta?.played ?? '—'} label="Jornadas" />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '0 12px', marginBottom: 16 }}>
            <StatTile value={ceuta?.won ?? '—'} label="Victorias" />
            <StatTile value={ceuta?.drawn ?? '—'} label="Empates" />
            <StatTile value={ceuta?.lost ?? '—'} label="Derrotas" />
          </div>

          {/* Goles */}
          <div style={{ margin: '0 12px 8px', background: 'var(--black)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Rendimiento ofensivo</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--white)' }}>{ceuta?.goalsFor ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Goles a favor</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--red)' }}>{ceuta?.goalsAgainst ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Goles en contra</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: ceuta && ceuta.goalDifference >= 0 ? 'var(--white)' : 'var(--red)' }}>
                  {ceuta ? (ceuta.goalDifference > 0 ? `+${ceuta.goalDifference}` : ceuta.goalDifference) : '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diferencia</div>
              </div>
            </div>
          </div>

          {/* % victorias */}
          <div style={{ margin: '0 12px 8px', background: 'var(--black)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>% de victorias</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--white)' }}>{winPct}%</div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${winPct}%`, background: 'var(--red)', borderRadius: 3, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Cuerpo técnico */}
          <SectionHeader title="Cuerpo técnico" sub="Staff" />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {STAFF.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--black)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === 0 ? 'var(--red)' : 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {s.emoji}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--white)' }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{s.role}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PLANTILLA ── */}
      {tab === 'plantilla' && (
        <>
          <div style={{ padding: '0 12px 12px', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {total} jugadores · Toca cada línea para expandir
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
