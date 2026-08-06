'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Transfer } from '@/infrastructure/supabase/TransfersRepository'
import { getLocalLogo } from '@/lib/teamLogos'

const POSITIONS: Record<string, string> = {
  POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista', DEL: 'Delantero',
}

type Tab = 'in' | 'out' | 'renew' | 'rumor'

const TABS: { id: Tab; label: string }[] = [
  { id: 'renew', label: 'Renovados' },
  { id: 'in',    label: 'Fichados'  },
  { id: 'out',   label: 'Salidas'   },
  { id: 'rumor', label: 'Rumores'   },
]

const BADGE_LABEL: Record<Tab, string> = {
  renew: 'Renovado',
  in:    'Oficial',
  out:   'Salida',
  rumor: 'Rumor',
}

const REL_TEXT: Record<number, string> = { 3: 'Muy fiable', 2: 'Posible', 1: 'Especulación' }

const ROUTE_LABEL: Record<Tab, string> = {
  in:    'Procede de',
  out:   'Destino',
  renew: 'Renueva hasta',
  rumor: 'Suena desde',
}

function ClubLogo({ name }: { name: string }) {
  const logo = getLocalLogo(name)
  if (logo) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image src={logo} alt={name} width={24} height={24} className="size-6 object-contain" />
      </div>
    )
  }
  const initials = name.replace(/\b(fc|cf|ad|sd|ud|cd|rc|real|atletico|club|deportivo)\b/gi, '').trim().slice(0, 2).toUpperCase()
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm font-display text-[10px] font-black text-ceuta-muted">
      {initials}
    </div>
  )
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className={on ? 'text-ceuta-red' : 'text-ceuta-border'}>
      <path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-1.2-.5-2-1-2.8.3 1.4-.3 2.3-1 2.3.6-2.3-1-3.5-1-5.5 0-1.5 0-3-1-5z"/>
    </svg>
  )
}

function PlayerPhoto({ photoUrl, name, type }: { photoUrl: string | null; name: string; type: Tab }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const ringCls =
    type === 'in'    ? 'ring-2 ring-ceuta-black'  :
    type === 'renew' ? 'ring-2 ring-[#1E7F47]'    :
    type === 'out'   ? 'ring-2 ring-ceuta-red'    :
                       'ring-2 ring-ceuta-border'

  return (
    <div className={`relative size-[58px] shrink-0 overflow-hidden rounded-full bg-ceuta-bg-soft ${ringCls}`}>
      {photoUrl && !error ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse rounded-full bg-ceuta-bg-mid" />
          )}
          <Image
            src={photoUrl}
            alt={name} fill sizes="58px"
            className="object-cover object-top"
            onError={() => setError(true)}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div className="flex size-full items-center justify-center bg-ceuta-black">
          <span className="font-display text-[20px] font-black text-white/30">{initials}</span>
        </div>
      )}
    </div>
  )
}

function TransferCard({ t, type, idx }: { t: Transfer; type: Tab; idx: number }) {
  const exitRumor = type === 'rumor' && isExitRumor(t)

  const badgeCls = exitRumor ? 'bg-ceuta-bg-mid text-ceuta-muted' :
    type === 'renew' ? 'bg-[#E4F3EA] text-[#1E7F47]'      :
    type === 'in'    ? 'bg-ceuta-black text-white'          :
    type === 'out'   ? 'bg-ceuta-red-soft text-ceuta-red'   :
                       'bg-ceuta-bg-mid text-ceuta-muted'
  const badgeLabel = exitRumor ? 'Posible salida' : BADGE_LABEL[type]

  const routeClub = type === 'in'
    ? t.clubFrom
    : type === 'out'
      ? t.clubTo
      : type === 'renew'
        ? 'AD Ceuta FC'
        : exitRumor ? (t.clubTo ?? 'Por determinar') : (t.clubFrom ?? null)

  const routeLabel = exitRumor ? 'Posible destino' : ROUTE_LABEL[type]
  const showRoute  = !!(routeClub || type === 'renew')

  return (
    <div
      className={`relative overflow-hidden rounded-[14px] bg-white ${type === 'rumor' ? 'border-[1.5px] border-dashed border-ceuta-border' : 'border border-ceuta-border'}`}
      style={{ animationDelay: `${idx * 0.04}s` }}
    >
      {/* left colour bar */}
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${
        type === 'renew' ? 'bg-[#1E7F47]'   :
        type === 'in'    ? 'bg-ceuta-black'  :
        type === 'out'   ? 'bg-ceuta-red'    :
                           'bg-ceuta-gold'
      }`} />

      <div className="pb-[13px] pl-[19px] pr-[15px] pt-[14px]">
        {/* top row */}
        <div className="flex items-center gap-3">
          <PlayerPhoto photoUrl={t.photoUrl} name={t.name} type={type} />

          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[19px] font-extrabold uppercase leading-none tracking-[0.01em] text-ceuta-black">
              {t.name}
            </div>
            <div className="mt-[7px] flex flex-wrap items-center gap-[7px]">
              <span className={`rounded-[4px] px-2 py-[3px] font-display text-[10px] font-bold uppercase tracking-[0.08em] ${
                type === 'renew' ? 'bg-[#1E7F47] text-white'   :
                type === 'in'    ? 'bg-ceuta-black text-white'  :
                type === 'out'   ? 'bg-ceuta-red text-white'    :
                                   'bg-ceuta-gold text-black'
              }`}>
                {POSITIONS[t.position] ?? t.position}
              </span>
            </div>
          </div>

          <span className={`flex shrink-0 items-center gap-1 self-start rounded-[5px] px-[9px] py-[5px] font-display text-[10px] font-extrabold uppercase tracking-[0.1em] ${badgeCls}`}>
            {type === 'in'    && <CheckIcon />}
            {type === 'renew' && <RenewIcon />}
            {badgeLabel}
          </span>
        </div>

        {/* route box */}
        {showRoute && (
          <div className="mt-[13px] flex items-center gap-[10px] rounded-[8px] bg-ceuta-bg-soft px-3 py-[10px]">
            <div className="flex shrink-0 items-center justify-center">
              <ClubLogo name={type === 'renew' ? 'AD Ceuta FC' : (routeClub ?? '')} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.13em] text-ceuta-muted">
                {routeLabel}
              </div>
              <div className="mt-[1px] truncate font-display text-[15px] font-bold uppercase leading-[1.05] tracking-[0.02em] text-ceuta-black">
                {type === 'renew' ? (t.clubTo ?? 'AD Ceuta FC') : routeClub}
              </div>
            </div>
            <div className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
              type === 'renew' ? 'bg-[#1E7F47] text-white'  :
              type === 'in'    ? 'bg-ceuta-black text-white' :
              type === 'out'   ? 'bg-ceuta-red text-white'   :
                                 'bg-ceuta-gold text-black'
            }`}>
              {(type === 'out' || exitRumor) ? <ArrowOut /> : type === 'renew' ? <RenewIcon /> : <ArrowIn />}
            </div>
          </div>
        )}

        {/* reliability (rumors) */}
        {type === 'rumor' && (
          <div className="mt-[13px] flex items-center gap-[9px] border-t border-dashed border-ceuta-border pt-3">
            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.13em] text-ceuta-muted">
              Fiabilidad
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => <FlameIcon key={i} on={i <= t.reliability} />)}
            </div>
            <span className={`ml-auto font-display text-[11px] font-bold uppercase tracking-[0.06em] ${
              t.reliability === 3 ? 'text-ceuta-red'   :
              t.reliability === 2 ? 'text-[#c9a200]'   :
                                    'text-ceuta-muted'
            }`}>
              {REL_TEXT[t.reliability] ?? ''}
            </span>
          </div>
        )}

        {/* notes */}
        {t.notes && (
          <p className="mt-[10px] font-body text-[12px] leading-[1.45] text-ceuta-muted">
            {t.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function RumorDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[10px] pb-[10px] pt-[18px]">
      <div className="h-0.5 w-[18px] shrink-0 bg-ceuta-red" />
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
        {label}
      </span>
      <div className="h-px flex-1 bg-ceuta-border" />
    </div>
  )
}

function RumorList({ transfers }: { transfers: Transfer[] }) {
  const arrivals = transfers.filter(t => !isExitRumor(t))
  const exits    = transfers.filter(t => isExitRumor(t))
  return (
    <div className="pb-6">
      {arrivals.length > 0 && (
        <>
          <RumorDivider label="En el radar" />
          <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {arrivals.map((t, i) => <TransferCard key={t.id} t={t} type="rumor" idx={i} />)}
          </div>
        </>
      )}
      {exits.length > 0 && (
        <>
          <RumorDivider label="Posibles salidas" />
          <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
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
    <div className="py-12 text-center font-display text-[13px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">
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
    out:   'Bajas y salidas', rumor: 'En el radar',
  }

  return (
    <div className="page min-h-screen bg-ceuta-bg">
      {/* Hero */}
      <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Temporada 2026–27
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          MERCADO DE<br />
          <em className="not-italic text-ceuta-gold">FICHAJES</em>
        </div>
      </div>

      {/* Counter pills overlapping hero */}
      <div className="relative z-[3] -mt-11 grid grid-cols-4 gap-1.5 px-3">
        {TABS.map(t => {
          const active = tab === t.id
          const COLOR: Record<string, string> = {
            renew: '#1E7F47',
            in:    'var(--black)',
            out:   'var(--red)',
            rumor: 'var(--gold)',
          }
          const color = COLOR[t.id]
          const isLight = t.id === 'rumor' || t.id === 'renew'

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative overflow-hidden rounded-[14px] border-[1.5px] px-1.5 pb-[11px] pt-[13px] text-center shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-colors"
              style={active
                ? { backgroundColor: color, borderColor: color }
                : { backgroundColor: '#fff', borderColor: 'var(--border)' }
              }
            >
              {!active && (
                <div className="absolute left-0 right-0 top-0 h-1" style={{ backgroundColor: color }} />
              )}
              <div
                className="font-display text-[30px] font-black leading-[0.9]"
                style={{ color: active ? (isLight ? '#000' : '#fff') : 'var(--black)' }}
              >
                {counts[t.id]}
              </div>
              <div
                className="mt-[5px] font-display text-[9px] font-bold uppercase tracking-[0.08em]"
                style={{ color: active ? (isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)') : 'var(--muted)' }}
              >
                {t.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="px-3">
        {filtered.length > 0 && (
          <div className="flex items-baseline justify-between px-1 pb-2 pt-[14px]">
            <span className="font-display text-[16px] font-extrabold uppercase tracking-[0.02em] text-ceuta-black">
              {headTitle[tab]}
            </span>
            <span className="font-body text-[12px] text-ceuta-muted">
              {filtered.length} movimientos
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : tab === 'rumor' ? (
          <RumorList transfers={filtered} />
        ) : (
          <div className="grid gap-[10px] pb-6 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {filtered.map((t, i) => (
              <TransferCard key={t.id} t={t} type={tab} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
