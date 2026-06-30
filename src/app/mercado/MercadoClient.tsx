'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'

const TYPE_LABELS: Record<TransferType, string> = {
  in: 'Fichaje', out: 'Salida', rumor: 'Rumor', renew: 'Renovación',
}
const TYPE_COLORS: Record<TransferType, string> = {
  in: '#166534', out: 'var(--red)', rumor: 'var(--muted)', renew: '#92700a',
}
const TABS: { id: TransferType; label: string; color: string }[] = [
  { id: 'renew', label: 'Renovados', color: '#166534' },
  { id: 'in',    label: 'Fichados',  color: '#166534' },
  { id: 'out',   label: 'Salidas',   color: 'var(--red)' },
  { id: 'rumor', label: 'Rumores',   color: 'var(--muted)' },
]

export default function MercadoClient({ transfers }: { transfers: Transfer[] }) {
  const [activeTab, setActiveTab] = useState<TransferType>('renew')
  const filtered = transfers.filter((t) => t.type === activeTab)

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ paddingBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.18em', color: 'var(--red)',
          fontFamily: 'var(--font-display)', marginBottom: 4,
        }}>
          Temporada 2025–26
        </div>
        <div style={{
          fontSize: 28, fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '-0.01em', fontFamily: 'var(--font-display)',
          color: 'var(--black)',
        }}>
          Mercado de fichajes
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const count = transfers.filter((t) => t.type === tab.id).length
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: active ? tab.color : 'var(--bone)',
              color: active ? 'var(--white)' : 'var(--muted)',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {tab.label}
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--bone-2)',
                color: active ? 'var(--white)' : 'var(--black)',
                borderRadius: 'var(--r-pill)', padding: '1px 7px', fontSize: 11, fontWeight: 900,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
          Sin movimientos en esta categoría
        </div>
      )}

      {filtered.map((t) => (
        <div key={t.id} style={{
          background: 'var(--white)', borderRadius: 14, padding: '14px 16px',
          marginBottom: 12, boxShadow: 'var(--shadow-card)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {t.photoUrl ? (
            <div style={{
              width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
              background: 'var(--bone-2)', position: 'relative', flexShrink: 0,
            }}>
              <Image
                src={t.photoUrl.includes('supabase.co')
                  ? t.photoUrl
                  : `/api/proxy/image?url=${encodeURIComponent(t.photoUrl)}&w=104`}
                alt={t.name}
                fill
                sizes="52px"
                className="object-cover object-top"
                unoptimized
              />
            </div>
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 10, flexShrink: 0,
              background: 'var(--bone-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24" style={{ color: 'var(--muted-2)' }}>
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, textTransform: 'uppercase',
              fontFamily: 'var(--font-display)', color: 'var(--black)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {t.name}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px',
                borderRadius: 'var(--r-pill)', background: TYPE_COLORS[t.type],
                color: 'var(--white)', fontFamily: 'var(--font-display)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {TYPE_LABELS[t.type]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {t.position}
              </span>
              {t.clubFrom && (
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>← {t.clubFrom}</span>
              )}
              {t.clubTo && (
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>→ {t.clubTo}</span>
              )}
              {t.type === 'rumor' && (
                <span style={{ fontSize: 11 }}>{'🔥'.repeat(t.reliability)}</span>
              )}
            </div>
            {t.notes && (
              <div style={{
                fontSize: 12, color: 'var(--muted)', marginTop: 5,
                fontFamily: 'var(--font-body)', lineHeight: 1.4,
              }}>
                {t.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
