'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { Transfer } from '@/infrastructure/supabase/TransfersRepository'

const POSITIONS: Record<string, string> = {
  POR: 'Portero',
  DEF: 'Defensa',
  MED: 'Centrocampista',
  DEL: 'Delantero',
}

type Tab = 'in' | 'out' | 'renew' | 'rumor'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'in', label: 'Fichados', emoji: '✅' },
  { id: 'renew', label: 'Renovados', emoji: '🔄' },
  { id: 'out', label: 'Salidas', emoji: '🚪' },
  { id: 'rumor', label: 'Rumores', emoji: '🔥' },
]

function Reliability({ value }: { value: 1 | 2 | 3 }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ fontSize: 12, opacity: i <= value ? 1 : 0.2 }}>
          🔥
        </span>
      ))}
    </div>
  )
}

function PlayerAvatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  const [error, setError] = useState(false)

  if (photoUrl && !error) {
    return (
      <div style={{
        width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
        flexShrink: 0, border: '2px solid var(--border)', background: 'var(--bone)',
        position: 'relative',
      }}>
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="64px"
          className="object-cover object-top"
          onError={() => setError(true)}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div style={{
      width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
      background: 'var(--black)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', border: '2px solid var(--border)',
    }}>
      <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--white)', fontFamily: 'var(--font-display)' }}>
        {name[0].toUpperCase()}
      </span>
    </div>
  )
}

function TransferCard({ t }: { t: Transfer }) {
  const isIn = t.type === 'in'
  const isOut = t.type === 'out'
  const isRumor = t.type === 'rumor'
  const isRenew = t.type === 'renew'

  const badge = isIn
    ? { label: 'FICHAJE', bg: 'var(--black)', color: 'var(--white)' }
    : isOut
      ? { label: 'SALIDA', bg: 'var(--red)', color: 'var(--white)' }
      : isRenew
        ? { label: 'RENOVADO', bg: 'var(--gold)', color: 'var(--black)' }
        : { label: 'RUMOR', bg: 'var(--bone-2)', color: 'var(--muted)' }

  const clubLine = isIn
    ? t.clubFrom ? `← ${t.clubFrom}` : null
    : isOut
      ? t.clubTo ? `→ ${t.clubTo}` : null
      : null

  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <PlayerAvatar photoUrl={t.photoUrl} name={t.name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--black)',
          }}>
            {t.name}
          </span>
          <span style={{
            background: badge.bg, color: badge.color,
            fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-display)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '2px 7px', borderRadius: 'var(--r-pill)',
          }}>
            {badge.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--red)', color: 'var(--white)',
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '2px 8px', borderRadius: 'var(--r-pill)',
          }}>
            {POSITIONS[t.position] ?? t.position}
          </span>
          {clubLine && (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
              {clubLine}
            </span>
          )}
        </div>

        {isRumor && <Reliability value={t.reliability} />}
        {t.notes && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {t.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, string> = {
    in: 'Sin fichajes confirmados todavía',
    out: 'Sin salidas confirmadas todavía',
    rumor: 'Sin rumores por el momento',
  }
  return (
    <div style={{
      padding: '40px 0', textAlign: 'center',
      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)',
    }}>
      {msgs[tab]}
    </div>
  )
}

export default function MercadoPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [tab, setTab] = useState<Tab>('in')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transfers')
      .then((r) => r.json())
      .then((d) => setTransfers(d.transfers ?? []))
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    in: transfers.filter((t) => t.type === 'in').length,
    out: transfers.filter((t) => t.type === 'out').length,
    rumor: transfers.filter((t) => t.type === 'rumor').length,
    renew: transfers.filter((t) => t.type === 'renew').length,
  }

  const filtered = transfers.filter((t) => t.type === tab)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'var(--black)', padding: '32px 16px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative stripes */}
        <div style={{
          position: 'absolute', top: 0, right: -20, width: 180, height: '100%',
          background: 'var(--red)', opacity: 0.08, transform: 'skewX(-12deg)',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--red)',
          marginBottom: 6,
        }}>
          AD Ceuta FC · Pretemporada 2025–26
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--white)',
          lineHeight: 0.95, marginBottom: 20,
        }}>
          MERCADO<br />
          <span style={{ color: 'var(--red)' }}>DE FICHAJES</span>
        </div>

        {/* Counters */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Fichados', count: counts.in, color: 'var(--white)' },
            { label: 'Renovados', count: counts.renew, color: 'var(--gold)' },
            { label: 'Salidas', count: counts.out, color: 'var(--red)' },
            { label: 'Rumores', count: counts.rumor, color: '#888' },
          ].map((c) => (
            <div key={c.label} style={{
              background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--r-sm)',
              padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
                color: c.color, lineHeight: 1,
              }}>
                {loading ? '—' : c.count}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.5)', marginTop: 2,
              }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '2px solid var(--border)',
        background: 'var(--white)', position: 'sticky', top: 56, zIndex: 10,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13,
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: tab === t.id ? 'var(--red)' : 'var(--muted)',
              borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent',
              marginBottom: -2, transition: 'color 0.15s',
            }}
          >
            {t.emoji} {t.label}
            {counts[t.id] > 0 && (
              <span style={{
                marginLeft: 6, background: tab === t.id ? 'var(--red)' : 'var(--bone-2)',
                color: tab === t.id ? 'var(--white)' : 'var(--muted)',
                fontSize: 10, fontWeight: 800, padding: '1px 6px',
                borderRadius: 'var(--r-pill)',
              }}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{
            padding: '40px 0', textAlign: 'center',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)',
          }}>
            Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          filtered.map((t) => <TransferCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  )
}
