'use client'

import { useState, useEffect, useCallback } from 'react'
import { MvpSheet, type BannerState as SheetState } from './MvpSheet'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'

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
    if (!s || s.status === 'pending') return 'none'
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
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

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
    abierta: { eye: 'Votación abierta ahora', title: '¡Vota ya al MVP!', sub: '¿Quién brilló hoy en el Murube?', icon: <IconVote /> },
    votado: { eye: 'Tu voto', title: `Has votado a ${votedPlayer?.name ?? ''}`, sub: 'Mira cómo evolucionan los resultados', icon: <IconCheck /> },
    cerrada: { eye: 'MVP del partido', title: `${winner?.name ?? 'Sin ganador'}, mejor jugador`, sub: 'Ver resultados completos', icon: <IconTrophy /> },
  }
  const cfg = configs[bannerState as SheetState]

  return (
    <>
      <div className="px-4 pt-3">
        <button className={`mvp-banner st-${bannerState}`} onClick={() => setSheetOpen(true)}>
          <div className="mb-strp" />
          <div className="mb-ic">{cfg.icon}</div>
          <div className="mb-main">
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
