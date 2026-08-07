'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { MvpSheet, type BannerState as SheetState } from './MvpSheet'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { getFingerprint } from '@/lib/fingerprint'

type BannerState = 'none' | SheetState

function getVotedSession(): string | null {
  return localStorage.getItem('mvp_voted_session')
}

function getVotedCandidateId(sessionId: string): string | null {
  return localStorage.getItem(`mvp_voted_${sessionId}`)
}

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const IconVote = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.5 13l2 2 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
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
  const leader = [...session.candidates].sort((a, b) => getCount(b.id) - getCount(a.id))[0]
  const leaderPct = total > 0 ? Math.round((getCount(leader?.id ?? '') / total) * 100) : 0
  const votedPlayer = session.candidates.find(c => c.id === votedId)
  const winner = session.status === 'closed'
    ? session.candidates.find(c => c.id === session.winner_id) ?? leader
    : leader

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

      <button
        type="button"
        onClick={() => {
          if (session) trackEvent(session.id, 'banner_click')
          setSheetOpen(true)
        }}
        className="relative mx-4 mt-3 block w-full overflow-hidden rounded-[18px] !bg-[var(--black)] px-[17px] pb-[17px] pt-4 text-left"
      >
        {/* Diagonal stripes */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'repeating-linear-gradient(-45deg,transparent 0 13px,rgba(255,255,255,0.055) 13px 26px)' }}
        />

        {/* Tag */}
        <div className="relative z-[2] flex items-center gap-[7px]">
          <span className="size-[7px] shrink-0 rounded-full bg-[var(--red)]" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--red)]">
            Votación MVP
          </span>
        </div>
        {session.match_label && (
          <div className="relative z-[2] mt-[5px] font-display text-[12px] font-semibold text-white/50">
            {session.match_label}
          </div>
        )}

        {/* Body por estado */}
        <div className="relative z-[2] mt-3.5">
          {bannerState === 'antes' && (
            <div className="flex items-center gap-3">
              <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] bg-white/[0.08] text-white/60">
                <IconClock />
              </div>
              <div>
                <b className="block font-display text-[16px] font-black uppercase text-white">MVP del partido</b>
                <span className="text-[12.5px] text-white/50">Se abre al pitido final</span>
              </div>
            </div>
          )}

          {(bannerState === 'abierta' || bannerState === 'votado') && leader && (
            <>
              <div className="flex items-center gap-[13px]">
                <div className="relative flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-[14px] bg-[radial-gradient(120%_80%_at_50%_0%,#2A2724,#0C0B0A)] shadow-[0_0_0_2px_var(--gold)]">
                  {leader.photo_url
                    ? <Image src={leader.photo_url} alt={leader.name} fill sizes="56px" className="object-cover object-top" />
                    : <Bust />}
                </div>
                <div className="min-w-0 flex-1">
                  {bannerState === 'votado' ? (
                    <>
                      <div className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
                        Has votado a {votedPlayer?.name ?? ''}
                      </div>
                      <div className="mt-0.5 truncate font-display text-[17px] font-black uppercase leading-[1.1] text-white">
                        Resultados en directo
                      </div>
                    </>
                  ) : (
                    <div className="truncate font-display text-[17px] font-black uppercase leading-[1.1] text-white">
                      {leader.name}
                    </div>
                  )}
                </div>
                <div className="text-right leading-none">
                  <span className="font-display text-[26px] font-black text-[var(--gold)]">{leaderPct}%</span>
                  <span className="mt-0.5 block font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/40">
                    {bannerState === 'votado' ? 'líder' : 'votos'}
                  </span>
                </div>
              </div>

              {bannerState === 'abierta' ? (
                <div className="mt-[15px] flex w-full items-center justify-center gap-2 rounded-[11px] bg-[var(--red)] py-3 font-display text-[13.5px] font-black uppercase tracking-[0.06em] text-white">
                  <IconVote /> Vota tú también
                </div>
              ) : (
                <div className="mt-[15px] flex w-full items-center justify-center gap-2 rounded-[11px] bg-white/10 py-3 font-display text-[13.5px] font-black uppercase tracking-[0.06em] text-white">
                  <IconCheck /> Ver cómo va
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1">
                    <span className="size-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                    <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/70">en vivo</span>
                  </span>
                </div>
              )}
            </>
          )}

          {bannerState === 'cerrada' && winner && (
            <>
              <div className="flex items-center gap-[13px]">
                <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-[#7A6100]">
                  <IconTrophy />
                </div>
                <div className="min-w-0">
                  <b className="block truncate font-display text-[16px] font-black uppercase text-white">
                    {winner.name}, MVP del partido
                  </b>
                  <span className="text-[12.5px] text-white/50">Elegido por la afición</span>
                </div>
              </div>
              <div className="mt-[15px] flex w-full items-center justify-center gap-2 rounded-[11px] bg-white/10 py-3 font-display text-[13.5px] font-black uppercase tracking-[0.06em] text-white">
                <IconChevron /> Ver resultados completos
              </div>
            </>
          )}
        </div>
      </button>

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
        />
      )}
    </>
  )
}
