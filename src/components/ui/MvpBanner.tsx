'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { MvpSheet, type BannerState as SheetState } from './MvpSheet'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { getLocalLogo } from '@/lib/teamLogos'

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

  const meta = session.match_meta
  function logoFor(name: string | undefined, url: string | null | undefined) {
    return getLocalLogo(name) ?? url ?? null
  }

  return (
    <>
      <div className="px-4 pt-5 pb-1">
        <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red mb-1">
          {bannerState === 'cerrada' ? 'Resultado' : 'MVP del partido'}
        </div>
        <div className="font-display text-[22px] font-black uppercase leading-tight text-ceuta-black">
          {bannerState === 'cerrada' ? 'Mejor jugador' : 'Vota al mejor'}
        </div>
      </div>
      <div className="px-4 pt-3">
        <button className={`mvp-banner st-${bannerState}`} onClick={() => {
          if (session) trackEvent(session.id, 'banner_click')
          setSheetOpen(true)
        }}>
          <div className="mb-strp" />

          {/* tag */}
          <div className="mb-header">
            <div className="mb-tag">
              <span className={`mb-dot${bannerState === 'abierta' ? ' green' : ''}`} />
              <span>{cfg.eye}</span>
            </div>
            {session.match_label && <div className="mb-jornada">{session.match_label}</div>}
          </div>

          {/* equipos */}
          {meta && (
            <div className="mb-teams">
              <div className="mb-team">
                <div className="mb-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logoFor(meta.home.name, meta.home.logo)
                    ? <img src={logoFor(meta.home.name, meta.home.logo)!} alt={meta.home.name} width={40} height={40} className="object-contain" />
                    : <span className="mb-logo-init">{meta.home.name?.[0]}</span>}
                </div>
                <span className="mb-team-name">{meta.home.name}</span>
              </div>

              {/* centro: foto MVP o icono */}
              <div className="mb-center">
                {bannerState === 'cerrada' && winner?.photo_url ? (
                  <div className="mb-winner-photo">
                    <Image src={winner.photo_url} alt={winner.name} width={52} height={52} className="w-full h-full object-cover object-top" />
                  </div>
                ) : (
                  <div className="mb-center-ic">{cfg.icon}</div>
                )}
                {bannerState === 'cerrada' && winner && (
                  <div className="mb-winner-name">{winner.name}</div>
                )}
              </div>

              <div className="mb-team">
                <div className="mb-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logoFor(meta.away.name, meta.away.logo)
                    ? <img src={logoFor(meta.away.name, meta.away.logo)!} alt={meta.away.name} width={40} height={40} className="object-contain" />
                    : <span className="mb-logo-init">{meta.away.name?.[0]}</span>}
                </div>
                <span className="mb-team-name">{meta.away.name}</span>
              </div>
            </div>
          )}

          <div className="mb-divider" />

          {/* footer */}
          <div className="mb-footer">
            <div className="mb-footer-text">
              <b>{cfg.title}</b>
              <span>{cfg.sub}</span>
            </div>
            <div className="mb-cta-pill">
              {bannerState === 'antes' ? 'Pronto' : bannerState === 'cerrada' ? 'Ver' : bannerState === 'votado' ? 'Ver votos' : 'Votar'} <span>›</span>
            </div>
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
        />
      )}
    </>
  )
}
