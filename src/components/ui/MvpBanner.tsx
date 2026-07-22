'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { MvpSheet, type BannerState as SheetState } from './MvpSheet'
import type { MvpSession, MvpVoteTally, MvpMatchMeta } from '@/infrastructure/supabase/MvpRepository'
import { supabase } from '@/infrastructure/supabase/client'

type BannerState = 'none' | SheetState

function getFingerprint(): string {
  let fp = localStorage.getItem('mvp_fp')
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('mvp_fp', fp)
  }
  return fp
}

function getVotedSession(): string | null {
  return localStorage.getItem('mvp_voted_session')
}

function getVotedCandidateId(sessionId: string): string | null {
  return localStorage.getItem(`mvp_voted_${sessionId}`)
}

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const IconVote = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.5 13l2 2 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M6 9V4h12v5a6 6 0 01-12 0zM4 6h2M18 6h2M9 20h6M12 15v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

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

  useEffect(() => {
    load()

    // Realtime: actualización instantánea si la tabla tiene replicación activada en Supabase
    const channel = supabase
      .channel('mvp_sessions_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_sessions' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  // Polling: solo cuando hay sesión activa (realtime cubre cambios de estado)
  useEffect(() => {
    if (!session) return // realtime se encarga si se abre una sesión
    const interval = session.status === 'closed' ? 120_000 : 60_000
    const id = setInterval(load, interval)
    return () => clearInterval(id)
  }, [load, session?.status])

  const handleVoted = useCallback((sessionId: string, candidateId: string) => {
    localStorage.setItem('mvp_voted_session', sessionId)
    localStorage.setItem(`mvp_voted_${sessionId}`, candidateId)
    setBannerState('votado')
    setVotedId(candidateId)
    load()
  }, [load])

  if (bannerState === 'none' || !session) return null

  const votedPlayer = session.candidates.find(c => c.id === votedId)
  const topVotes = tallies.length > 0 ? tallies.reduce((a, b) => a.count >= b.count ? a : b) : null
  const winner = session.status === 'closed'
    ? session.candidates.find(c => c.id === session.winner_id)
    : session.candidates.find(c => c.id === topVotes?.candidate_id)

  const configs: Record<SheetState, { eye: string; title: string; sub: string; icon: React.ReactNode }> = {
    antes: { eye: 'MVP del partido', title: 'Vota al mejor del Ceuta', sub: 'Se abre al pitido final', icon: <IconClock /> },
    abierta: { eye: 'Votación abierta ahora', title: '¿Quién fue el mejor de la jornada?', sub: 'Vota al MVP del partido', icon: <IconVote /> },
    votado: { eye: 'Tu voto', title: `Has votado a ${votedPlayer?.name ?? ''}`, sub: 'Mira cómo evolucionan los resultados', icon: <IconCheck /> },
    cerrada: { eye: 'MVP del partido', title: `${winner?.name ?? 'Sin ganador'}, mejor jugador`, sub: 'Ver resultados completos', icon: <IconTrophy /> },
  }
  const cfg = configs[bannerState as SheetState]

  return (
    <>
      <div className="px-4 pt-2 pb-1 bg-[var(--bg)] border-t border-[var(--border)]">
        <button className={`mvp-banner st-${bannerState}`} onClick={() => setSheetOpen(true)}>
          <div className="mb-strp" />
          {bannerState === 'cerrada' && winner?.photo_url ? (
            <div className="mb-ic !p-0 overflow-hidden rounded-[12px]">
              <Image
                src={winner.photo_url}
                alt={winner.name}
                width={46}
                height={46}
                className="w-full h-full object-cover object-top"
              />
            </div>
          ) : (
            <div className="mb-ic">{cfg.icon}</div>
          )}
          <div className="mb-main">
            {session.match_meta && (
              <div className="mb-match">
                {session.match_meta.home.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={session.match_meta.home.logo} alt={session.match_meta.home.name} width={16} height={16} className="object-contain" />
                  : null
                }
                <span className="mb-match-name">{session.match_meta.home.name}</span>
                <span className="mb-match-vs">vs</span>
                {session.match_meta.away.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={session.match_meta.away.logo} alt={session.match_meta.away.name} width={16} height={16} className="object-contain" />
                  : null
                }
                <span className="mb-match-name">{session.match_meta.away.name}</span>
              </div>
            )}
            <div className="mb-eye">
              {bannerState === 'abierta' && <span className="live-dot" />}
              {cfg.eye}
            </div>
            <div className="mb-title">{cfg.title}</div>
            <div className="mb-sub">{cfg.sub}</div>
          </div>
          <div className="mb-chev"><IconChevron /></div>
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
          onVoted={handleVoted}
          onRefresh={load}
        />
      )}
    </>
  )
}
