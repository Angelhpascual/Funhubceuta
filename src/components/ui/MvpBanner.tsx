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

export function MvpBanner() {
  const [session, setSession] = useState<MvpSession | null>(null)
  const [tallies, setTallies] = useState<MvpVoteTally[]>([])
  const [bannerState, setBannerState] = useState<BannerState>('none')
  const [sheetOpen, setSheetOpen] = useState(false)

  const computeState = useCallback((s: MvpSession | null): BannerState => {
    if (!s) return 'none'
    if (s.status === 'closed') return 'cerrada'
    if (s.status === 'open') {
      const voted = getVotedSession() === s.id
      return voted ? 'votado' : 'abierta'
    }
    return 'antes'
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mvp/active')
      const data = await res.json()
      setSession(data.session)
      setTallies(data.tallies ?? [])
      setBannerState(computeState(data.session))
    } catch { /* ignore */ }
  }, [computeState])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  const handleVoted = useCallback((sessionId: string) => {
    localStorage.setItem('mvp_voted_session', sessionId)
    setBannerState('votado')
    load()
  }, [load])

  if (bannerState === 'none') return null

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full text-left mx-0 rounded-none"
      >
        <BannerContent state={bannerState} session={session} tallies={tallies} />
      </button>

      {sheetOpen && session && (
        <MvpSheet
          session={session}
          tallies={tallies}
          bannerState={bannerState as SheetState}
          fingerprint={typeof window !== 'undefined' ? getFingerprint() : ''}
          onClose={() => setSheetOpen(false)}
          onVoted={handleVoted}
          onRefresh={load}
        />
      )}
    </>
  )
}

function BannerContent({
  state,
  session,
  tallies,
}: {
  state: BannerState
  session: MvpSession | null
  tallies: MvpVoteTally[]
}) {
  if (!session) return null

  const totalVotes = tallies.reduce((s, t) => s + t.count, 0)

  if (state === 'cerrada') {
    return (
      <div className="mx-4 mt-4 rounded-[14px] bg-ceuta-black px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-gold">MVP del partido</div>
          <div className="text-[15px] font-black uppercase text-white leading-tight truncate">
            {session.winner_name ?? 'Sin ganador'}
          </div>
          <div className="text-[10px] text-white/50">{session.match_label}</div>
        </div>
        <div className="text-[10px] font-bold text-white/40 shrink-0">Ver →</div>
      </div>
    )
  }

  if (state === 'votado') {
    return (
      <div className="mx-4 mt-4 rounded-[14px] bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-widest text-green-700">MVP del partido</div>
          <div className="text-[14px] font-black uppercase text-ceuta-black leading-tight">¡Voto registrado!</div>
          <div className="text-[10px] text-ceuta-muted">{totalVotes} voto{totalVotes !== 1 ? 's' : ''} · {session.match_label}</div>
        </div>
        <div className="text-[10px] font-bold text-ceuta-muted shrink-0">Ver →</div>
      </div>
    )
  }

  if (state === 'abierta') {
    return (
      <div className="mx-4 mt-4 rounded-[14px] bg-ceuta-red px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">En directo</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-black uppercase text-white leading-tight">Elige el MVP</div>
          <div className="text-[10px] text-white/70">{session.match_label}</div>
        </div>
        <div className="text-[10px] font-bold text-white/60 shrink-0">Votar →</div>
      </div>
    )
  }

  // antes
  return (
    <div className="mx-4 mt-4 rounded-[14px] bg-ceuta-bg-soft border border-ceuta-border px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">⭐</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">MVP del partido</div>
        <div className="text-[14px] font-black uppercase text-ceuta-black leading-tight">Próximamente</div>
        <div className="text-[10px] text-ceuta-muted">{session.match_label}</div>
      </div>
    </div>
  )
}
