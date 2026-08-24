'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { MvpSheet, type BannerState as SheetState } from './MvpSheet'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { getLocalLogo } from '@/data/teamLogos'
import { getFingerprint } from '@/lib/fingerprint'

type BannerState = 'none' | SheetState

function getVotedSession(): string | null {
  return localStorage.getItem('mvp_voted_session')
}

function getVotedCandidateId(sessionId: string): string | null {
  return localStorage.getItem(`mvp_voted_${sessionId}`)
}

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M6 9V4h12v5a6 6 0 01-12 0zM4 6h2M18 6h2M9 20h6M12 15v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function Bust() {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-auto">
      <circle cx="60" cy="50" r="25" fill="#CFC9BF" />
      <path d="M6 150v-30c0-30 24-52 54-52s54 22 54 52v30z" fill="#EDEAE4" />
    </svg>
  )
}

function logoFor(name: string | undefined, url: string | null | undefined) {
  return getLocalLogo(name) ?? url ?? null
}

// Patrocinador del banner MVP: sin acuerdo cerrado aún, oculto en producción
// pero el bloque se conserva para reactivarlo cuando haya patrocinador.
const SHOW_MVP_SPONSOR = false

/* ── header compartido: tag + patrocinador + línea de partido ── */
function CardHeader({ label, matchLabel, children }: { label: string; matchLabel: string | null; children?: React.ReactNode }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-[7px]">
          <span className="size-[7px] shrink-0 rounded-full bg-[var(--red)]" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--red)]">
            {label}
          </span>
        </div>
        {SHOW_MVP_SPONSOR && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-white/40">Con</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white/70">
              Patrocinador
            </span>
          </div>
        )}
      </div>
      {children ?? (matchLabel && (
        <div className="mt-[5px] font-display text-[12.5px] font-semibold text-white/50">
          {matchLabel}
        </div>
      ))}
    </>
  )
}

/* ── chip compacto de equipo: escudo pequeño + nombre, con fondo para legibilidad ── */
function TeamChip({ name, logo }: { name: string; logo?: string | null }) {
  const src = logoFor(name, logo)
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-2.5">
      <div className="flex size-[18px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {src
          ? <Image src={src} alt={name} width={13} height={13} className="object-contain" />
          : <span className="font-display text-[8px] font-black text-white/60">{name?.[0]}</span>}
      </div>
      <span className="truncate font-display text-[10.5px] font-bold uppercase tracking-[0.02em] text-white/80">
        {name}
      </span>
    </div>
  )
}

function CardDivider() {
  return <div className="my-4 border-t border-white/10" />
}

export function MvpBanner() {
  const [session, setSession] = useState<MvpSession | null>(null)
  const [tallies, setTallies] = useState<MvpVoteTally[]>([])
  const [bannerState, setBannerState] = useState<BannerState>('none')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [votedId, setVotedId] = useState<string | null>(null)

  const computeState = useCallback((s: MvpSession | null): BannerState => {
    if (!s) return 'none'
    if (s.status === 'pending') return 'antes'
    if (s.status === 'closed') return 'cerrada'
    const voted = getVotedSession() === s.id
    return voted ? 'votado' : 'abierta'
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mvp/active')
      const data = await res.json()
      setSession(data.session)
      setTallies(data.tallies ?? [])
      const state = computeState(data.session)
      setBannerState(state)
      if (data.session) {
        setVotedId(getVotedCandidateId(data.session.id))
      }
    } catch { /* ignore */ }
  }, [computeState])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('mvp_sessions_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_sessions' }, () => { load() })
      .subscribe()

    const interval = session.status === 'closed' ? 120_000 : 60_000
    const id = setInterval(load, interval)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(id)
    }
  }, [load, session?.id, session?.status])

  function trackEvent(sessionId: string, event: string) {
    fetch('/api/mvp/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, event, fingerprint: typeof window !== 'undefined' ? getFingerprint() : null }),
    }).catch(() => {})
  }

  const handleVoted = useCallback((sessionId: string, candidateId: string) => {
    localStorage.setItem('mvp_voted_session', sessionId)
    localStorage.setItem(`mvp_voted_${sessionId}`, candidateId)
    setBannerState('votado')
    setVotedId(candidateId)
    load()
  }, [load])

  if (bannerState === 'none' || !session) return null

  const total = tallies.reduce((s, t) => s + t.count, 0)
  const getCount = (id: string) => tallies.find(t => t.candidate_id === id)?.count ?? 0
  const sorted = [...session.candidates].sort((a, b) => getCount(b.id) - getCount(a.id))
  const leaderId = sorted[0]?.id
  const votedPlayer = session.candidates.find(c => c.id === votedId)
  const votedRank = votedPlayer ? sorted.findIndex(c => c.id === votedPlayer.id) : -1
  const votedPct = votedPlayer ? (total > 0 ? Math.round((getCount(votedPlayer.id) / total) * 100) : 0) : 0
  const winner = session.status === 'closed'
    ? session.candidates.find(c => c.id === session.winner_id) ?? sorted[0]
    : sorted[0]
  const winnerPct = winner && total > 0 ? Math.round((getCount(winner.id) / total) * 100) : 0

  const meta = session.match_meta
  const matchLabel = session.match_label
    ?? (meta ? `${meta.home.name} vs ${meta.away.name}` : null)

  return (
    <>
      <div className="px-4 pt-5 pb-1">
        <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)] mb-1">
          Tu voto cuenta
        </div>
        <div className="font-display text-[21px] font-black uppercase leading-tight text-[var(--black)]">
          MVP del partido
        </div>
      </div>

      <div className="px-4 mt-3">
      <button
        type="button"
        onClick={() => {
          if (session) trackEvent(session.id, 'banner_click')
          setSheetOpen(true)
        }}
        className="relative w-full overflow-hidden rounded-[18px] !bg-[var(--black)] px-[17px] pb-[17px] pt-4 text-left"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 13px,rgba(255,255,255,0.03) 13px 26px)' }}
        />

        <div className="relative z-[2]">
          <CardHeader label="Votación MVP" matchLabel={matchLabel}>
            {bannerState === 'abierta' && meta ? (
              <div className="mt-[7px] flex items-center gap-2">
                <TeamChip name={meta.home.name} logo={meta.home.logo} />
                <span className="font-display text-[10px] font-bold uppercase text-white/30">vs</span>
                <TeamChip name={meta.away.name} logo={meta.away.logo} />
              </div>
            ) : undefined}
          </CardHeader>

          {/* ── ANTES: escudos + vs ── */}
          {bannerState === 'antes' && meta && (
            <>
              <div className="mt-4 grid grid-cols-3 items-center gap-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06]">
                    {logoFor(meta.home.name, meta.home.logo)
                      ? <Image src={logoFor(meta.home.name, meta.home.logo)!} alt={meta.home.name} width={40} height={40} className="object-contain" />
                      : <span className="font-display text-[20px] font-black text-white/50">{meta.home.name?.[0]}</span>}
                  </div>
                  <span className="font-display text-[12px] font-bold uppercase tracking-[0.02em] text-white">{meta.home.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-white/50">
                  <IconClock />
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em]">Pronto</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/[0.06]">
                    {logoFor(meta.away.name, meta.away.logo)
                      ? <Image src={logoFor(meta.away.name, meta.away.logo)!} alt={meta.away.name} width={40} height={40} className="object-contain" />
                      : <span className="font-display text-[20px] font-black text-white/50">{meta.away.name?.[0]}</span>}
                  </div>
                  <span className="font-display text-[12px] font-bold uppercase tracking-[0.02em] text-white">{meta.away.name}</span>
                </div>
              </div>
              <CardDivider />
              <b className="block font-display text-[19px] font-black uppercase text-white">MVP del partido</b>
              <span className="text-[13px] text-white/50">La votación se abre al pitido final</span>
            </>
          )}
          {bannerState === 'antes' && !meta && (
            <>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] bg-white/[0.08] text-white/60">
                  <IconClock />
                </div>
                <div>
                  <b className="block font-display text-[16px] font-black uppercase text-white">MVP del partido</b>
                  <span className="text-[12.5px] text-white/50">Se abre al pitido final</span>
                </div>
              </div>
            </>
          )}

          {/* ── ABIERTA: 3 candidatos ── */}
          {bannerState === 'abierta' && (
            <>
              <div className="mt-4 flex gap-2.5 overflow-x-auto">
                {sorted.map((c) => {
                  const pct = total > 0 ? Math.round((getCount(c.id) / total) * 100) : 0
                  const isLeader = c.id === leaderId && total > 0
                  return (
                    <div
                      key={c.id}
                      className={`relative w-[100px] shrink-0 overflow-hidden rounded-[14px] border ${isLeader ? 'border-[var(--gold)]' : 'border-white/10'} bg-[radial-gradient(120%_80%_at_50%_0%,#2A2724,#0C0B0A)] pb-2`}
                    >
                      {isLeader && (
                        <span className="absolute left-2 top-2 z-[1] rounded-full bg-[var(--gold)] px-2 py-[3px] font-display text-[8.5px] font-black uppercase tracking-[0.04em] text-[#4A3600]">
                          Líder
                        </span>
                      )}
                      <div className="relative flex h-[100px] items-end justify-center overflow-hidden">
                        {c.photo_url
                          ? <Image src={c.photo_url} alt={c.name} fill sizes="100px" className="object-cover object-top" />
                          : <Bust />}
                      </div>
                      <div className="mt-1.5 truncate px-2 font-display text-[11.5px] font-bold uppercase text-white">
                        {c.name}
                      </div>
                      <div className="px-2 font-display text-[15px] font-black text-[var(--gold)]">{pct}%</div>
                    </div>
                  )
                })}
              </div>
              <CardDivider />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <b className="block font-display text-[15px] font-black uppercase text-white">¿Quién fue el mejor?</b>
                  <span className="text-[12.5px] text-white/50">Vota al MVP del partido</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--red)] px-5 py-3 font-display text-[13px] font-black uppercase tracking-[0.05em] text-white">
                  Votar <IconChevron />
                </div>
              </div>
            </>
          )}

          {/* ── VOTADO ── */}
          {bannerState === 'votado' && votedPlayer && (
            <>
              <div className="mt-4 flex items-center gap-[13px]">
                <div className="relative flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-full bg-[radial-gradient(120%_80%_at_50%_0%,#2A2724,#0C0B0A)] shadow-[0_0_0_2px_#1E7F47]">
                  {votedPlayer.photo_url
                    ? <Image src={votedPlayer.photo_url} alt={votedPlayer.name} fill sizes="56px" className="object-cover object-top" />
                    : <Bust />}
                  <span className="absolute bottom-0 right-0 flex size-[18px] items-center justify-center rounded-full bg-[#1E7F47] text-white">
                    <IconCheck />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">Has votado a</div>
                  <div className="truncate font-display text-[17px] font-black uppercase leading-[1.1] text-white">{votedPlayer.name}</div>
                  <div className="mt-0.5 text-[12px] text-white/40">{votedPlayer.position}</div>
                </div>
                <div className="shrink-0 text-right leading-none">
                  <span className="font-display text-[26px] font-black text-[var(--gold)]">{votedPct}%</span>
                  <span className="mt-0.5 block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/40">
                    {votedRank === 0 ? 'va líder' : `${votedRank + 1}º lugar`}
                  </span>
                </div>
              </div>
              <CardDivider />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <b className="block font-display text-[15px] font-black uppercase text-white">Recuento en vivo</b>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--red)] px-5 py-3 font-display text-[13px] font-black uppercase tracking-[0.05em] text-white">
                  Cambiar voto <IconChevron />
                </div>
              </div>
            </>
          )}

          {/* ── CERRADA ── */}
          {bannerState === 'cerrada' && winner && (
            <>
              <div className="mt-4 flex items-center gap-[13px]">
                <div className="relative flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-full bg-[radial-gradient(120%_80%_at_50%_0%,#2A2724,#0C0B0A)] shadow-[0_0_0_2px_var(--gold)]">
                  {winner.photo_url
                    ? <Image src={winner.photo_url} alt={winner.name} fill sizes="56px" className="object-cover object-top" />
                    : <Bust />}
                  <span className="absolute bottom-0 right-0 flex size-[18px] items-center justify-center rounded-full bg-[var(--gold)] text-[#7A6100]">
                    <IconTrophy />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold)]">Ganador</div>
                  <div className="truncate font-display text-[17px] font-black uppercase leading-[1.1] text-white">{winner.name}</div>
                  <div className="mt-0.5 text-[12px] text-white/40">Elegido por la afición</div>
                </div>
                <div className="shrink-0 text-right leading-none">
                  <span className="font-display text-[26px] font-black text-[var(--gold)]">{winnerPct}%</span>
                  <span className="mt-0.5 block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/40">de los votos</span>
                </div>
              </div>
              <CardDivider />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <b className="block font-display text-[15px] font-black uppercase text-white">Resultado final</b>
                  <span className="text-[12.5px] text-white/50">Ver clasificación completa</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--gold)] px-5 py-3 font-display text-[13px] font-black uppercase tracking-[0.05em] text-[#4A3600]">
                  Ver resultados <IconChevron />
                </div>
              </div>
            </>
          )}
        </div>
      </button>
      </div>

      {sheetOpen && session && (
        <MvpSheet
          session={session}
          tallies={tallies}
          bannerState={bannerState as SheetState}
          votedId={votedId}
          fingerprint={typeof window !== 'undefined' ? getFingerprint() : ''}
          onClose={() => setSheetOpen(false)}
          onVoted={(sid, cid) => { trackEvent(sid, 'vote_cast'); handleVoted(sid, cid) }}
          onRefresh={load}
          onOpen={() => { if (session) trackEvent(session.id, 'sheet_open') }}
          startInChangeMode={bannerState === 'votado'}
        />
      )}
    </>
  )
}
