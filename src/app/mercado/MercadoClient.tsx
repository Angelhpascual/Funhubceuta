'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Transfer } from '@/infrastructure/supabase/TransfersRepository'

const GREEN = '#1E7F47'
const GREEN_SOFT = '#E4F3EA'

const POSITIONS: Record<string, string> = {
  POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista', DEL: 'Delantero',
}

type Tab = 'in' | 'out' | 'renew' | 'rumor'

const TABS: { id: Tab; label: string; color: string; textColor: string }[] = [
  { id: 'renew', label: 'Renovados', color: GREEN,           textColor: '#fff' },
  { id: 'in',    label: 'Fichados',  color: 'var(--red)',    textColor: '#fff' },
  { id: 'out',   label: 'Salidas',   color: 'var(--black)',  textColor: '#fff' },
  { id: 'rumor', label: 'Rumores',   color: 'var(--gold)',   textColor: '#000' },
]

const TAB_CONFIG: Record<Tab, { color: string; textColor: string; accentBg: string }> = {
  renew: { color: GREEN,          textColor: '#fff', accentBg: GREEN_SOFT },
  in:    { color: 'var(--red)',   textColor: '#fff', accentBg: 'var(--red-soft, #FFE9EA)' },
  out:   { color: 'var(--black)', textColor: '#fff', accentBg: 'var(--bone-2, #ECEAE4)' },
  rumor: { color: 'var(--gold)',  textColor: '#000', accentBg: 'var(--gold-soft, #FFF6CC)' },
}

const BADGE: Record<Tab, { label: string; bg: string; color: string }> = {
  renew: { label: 'Renovado', bg: GREEN_SOFT,        color: GREEN },
  in:    { label: 'Oficial',  bg: 'var(--black)',     color: '#fff' },
  out:   { label: 'Salida',   bg: 'var(--red-soft, #FFE9EA)', color: 'var(--red)' },
  rumor: { label: 'Rumor',    bg: 'var(--bone-2, #ECEAE4)', color: 'var(--muted)' },
}

const REL_TEXT: Record<number, string> = { 3: 'Muy fiable', 2: 'Posible', 1: 'Especulación' }

const ROUTE_LABEL: Record<Tab, string> = {
  in:    'Procede de',
  out:   'Destino',
  renew: 'Renueva hasta',
  rumor: 'Suena desde',
}

function isExitRumor(t: Transfer): boolean {
  return t.clubFrom === 'AD Ceuta FC'
}

function ArrowIn() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
}
function ArrowOut() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
}
function RenewIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
}
function CheckIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
}
function FlameIcon({ on }: { on: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ color: on ? 'var(--red)' : 'var(--border)' }}>
      <path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-1.2-.5-2-1-2.8.3 1.4-.3 2.3-1 2.3.6-2.3-1-3.5-1-5.5 0-1.5 0-3-1-5z"/>
    </svg>
  )
}

function PlayerPhoto({ photoUrl, name, ring }: { photoUrl: string | null; name: string; ring: string }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', position: 'relative',
      background: 'var(--bone)',
      boxShadow: `0 0 0 2.5px ${ring}`,
    }}>
      {photoUrl && !error ? (
        <>
          {!loaded && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.2s infinite linear',
            }} />
          )}
          <Image
            src={photoUrl.includes('supabase.co') ? photoUrl : `/api/proxy/image?url=${encodeURIComponent(photoUrl)}&w=120`}
            alt={name} fill sizes="58px"
            className="object-cover object-top"
            onError={() => setError(true)}
            onLoad={() => setLoaded(true)}
            unoptimized
          />
        </>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'var(--black)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

function TransferCard({ t, type, idx }: { t: Transfer; type: Tab; idx: number }) {
  const cfg = TAB_CONFIG[type]
  const exitRumor = type === 'rumor' && isExitRumor(t)
  const badge = exitRumor
    ? { label: 'Posible salida', bg: 'var(--bone-2, #ECEAE4)', color: 'var(--muted)' }
    : BADGE[type]
  const routeClub = type === 'in'
    ? t.clubFrom
    : type === 'out'
      ? t.clubTo
      : type === 'renew'
        ? 'AD Ceuta FC'
        : exitRumor
          ? (t.clubTo ?? 'Por determinar')
          : (t.clubFrom ?? null)
  const routeLabel = exitRumor ? 'Posible destino' : ROUTE_LABEL[type]
  const ring = type === 'in' ? 'var(--red)' : type === 'renew' ? GREEN : 'var(--border)'

  return (
    <div style={{
      background: 'var(--white)',
      border: type === 'rumor' ? '1.5px dashed var(--border)' : '1px solid var(--border)',
      borderRadius: 14,
      position: 'relative', overflow: 'hidden',
      animationDelay: `${idx * 0.04}s`,
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: cfg.color,
      }} />

      <div style={{ padding: '14px 15px 13px 19px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <PlayerPhoto photoUrl={t.photoUrl} name={t.name} ring={ring} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19,
              lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase',
              color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {t.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: type === 'rumor' ? '#000' : '#fff',
                background: cfg.color,
                padding: '3px 8px', borderRadius: 4,
              }}>
                {POSITIONS[t.position] ?? t.position}
              </span>
            </div>
          </div>

          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '5px 9px', borderRadius: 5, flexShrink: 0, alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 4,
            background: badge.bg, color: badge.color,
          }}>
            {type === 'in' && <CheckIcon />}
            {type === 'renew' && <RenewIcon />}
            {badge.label}
          </span>
        </div>

        {(routeClub || type === 'renew') && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 13, padding: '10px 12px',
            background: 'var(--bone)', borderRadius: 8,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: cfg.color,
              color: type === 'rumor' ? '#000' : '#fff',
            }}>
              {(type === 'out' || exitRumor) ? <ArrowOut /> : type === 'renew' ? <RenewIcon /> : <ArrowIn />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--muted)',
              }}>
                {routeLabel}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--black)',
                lineHeight: 1.05, marginTop: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {type === 'renew' ? 'AD Ceuta FC' : routeClub}
              </div>
            </div>
          </div>
        )}

        {type === 'rumor' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            marginTop: 13, paddingTop: 12, borderTop: '1px dashed var(--border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 9.5, fontWeight: 700,
              letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--muted)',
            }}>
              Fiabilidad
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map(i => <FlameIcon key={i} on={i <= t.reliability} />)}
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 'auto',
              color: t.reliability === 3 ? 'var(--red)' : t.reliability === 2 ? '#c9a200' : 'var(--muted)',
            }}>
              {REL_TEXT[t.reliability] ?? ''}
            </span>
          </div>
        )}

        {t.notes && (
          <p style={{
            fontSize: 12, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.45,
            fontFamily: 'var(--font-body)',
          }}>
            {t.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function RumorDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '18px 4px 10px',
    }}>
      <div style={{ width: 18, height: 2, background: 'var(--red)', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function RumorList({ transfers }: { transfers: Transfer[] }) {
  const arrivals = transfers.filter(t => !isExitRumor(t))
  const exits = transfers.filter(t => isExitRumor(t))
  return (
    <div style={{ paddingBottom: 24 }}>
      {arrivals.length > 0 && (
        <>
          <RumorDivider label="En el radar" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {arrivals.map((t, i) => <TransferCard key={t.id} t={t} type="rumor" idx={i} />)}
          </div>
        </>
      )}
      {exits.length > 0 && (
        <>
          <RumorDivider label="Posibles salidas" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {exits.map((t, i) => <TransferCard key={t.id} t={t} type="rumor" idx={i} />)}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, string> = {
    in:    'Sin fichajes confirmados todavía',
    renew: 'Sin renovaciones confirmadas todavía',
    out:   'Sin salidas confirmadas todavía',
    rumor: 'Sin rumores por el momento',
  }
  return (
    <div style={{
      padding: '48px 0', textAlign: 'center',
      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)',
    }}>
      {msgs[tab]}
    </div>
  )
}

export default function MercadoClient({ transfers }: { transfers: Transfer[] }) {
  const [tab, setTab] = useState<Tab>('renew')

  const counts: Record<Tab, number> = {
    renew: transfers.filter(t => t.type === 'renew').length,
    in:    transfers.filter(t => t.type === 'in').length,
    out:   transfers.filter(t => t.type === 'out').length,
    rumor: transfers.filter(t => t.type === 'rumor').length,
  }

  const filtered = transfers.filter(t => t.type === tab)
  const headTitle: Record<Tab, string> = {
    renew: 'Renovaciones', in: 'Altas confirmadas',
    out: 'Bajas y salidas', rumor: 'En el radar',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        position: 'relative', background: 'var(--black)',
        color: '#fff', padding: '24px 18px 64px', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -50,
          width: 200, height: 200,
          background: 'repeating-linear-gradient(-45deg,#fff 0 14px,#000 14px 28px)',
          clipPath: 'polygon(70px 0,100% 0,100% 100%,0 100%)',
          opacity: 0.07, transform: 'rotate(8deg)', pointerEvents: 'none',
        }} />

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)',
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        }}>
          <span style={{ width: 18, height: 2, background: 'var(--red)', display: 'inline-block' }} />
          Temporada 2025–26
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 40,
          lineHeight: 0.92, letterSpacing: '-0.01em', textTransform: 'uppercase',
          position: 'relative', zIndex: 1,
        }}>
          MERCADO DE<br />
          <span style={{ color: 'var(--gold)' }}>FICHAJES</span>
        </div>

        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(255,255,255,0.6)',
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: GREEN,
            boxShadow: `0 0 0 3px rgba(30,127,71,0.25)`, display: 'inline-block', flexShrink: 0,
          }} />
          Ventana de verano · Pretemporada 2025–26
        </div>
      </div>

      {/* Counter pills / tabs overlapping hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6,
        margin: '-44px 12px 0', position: 'relative', zIndex: 3,
      }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: active ? t.color : 'var(--white)',
              border: `1.5px solid ${active ? t.color : 'var(--border)'}`,
              borderRadius: 14, padding: '13px 6px 11px', textAlign: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
            }}>
              {!active && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: 0, height: 4,
                  background: t.color,
                }} />
              )}
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30,
                lineHeight: 0.9,
                color: active ? t.textColor : 'var(--black)',
              }}>
                {counts[t.id]}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5,
                color: active
                  ? (t.id === 'rumor' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)')
                  : 'var(--muted)',
              }}>
                {t.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ padding: '0 12px' }}>
        {filtered.length > 0 && (
          <div style={{
            padding: '14px 4px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
              letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--black)',
            }}>
              {headTitle[tab]}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
              {filtered.length} movimientos
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : tab === 'rumor' ? (
          <RumorList transfers={filtered} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 10, paddingBottom: 24,
          }}>
            {filtered.map((t, i) => (
              <TransferCard key={t.id} t={t} type={tab} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
