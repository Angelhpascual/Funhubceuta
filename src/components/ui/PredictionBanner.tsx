'use client'

import { useState, useEffect, useCallback } from 'react'
import { PredictionSheet } from './PredictionSheet'
import { supabase } from '@/infrastructure/supabase/client'
import type { PredictionSession, UserPrediction } from '@/infrastructure/supabase/PredictionRepository'

function getFingerprint(): string {
  let fp = localStorage.getItem('mvp_fp')
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('mvp_fp', fp)
  }
  return fp
}

const IconDice = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="9" r="1.3" fill="currentColor"/>
    <circle cx="15" cy="9" r="1.3" fill="currentColor"/>
    <circle cx="9" cy="15" r="1.3" fill="currentColor"/>
    <circle cx="15" cy="15" r="1.3" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
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

export function PredictionBanner() {
  const [session, setSession] = useState<PredictionSession | null>(null)
  const [mine, setMine] = useState<UserPrediction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [fp] = useState(() => typeof window !== 'undefined' ? getFingerprint() : '')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/predictions/active?fp=${fp}`)
      const data = await res.json()
      setSession(data.session)
      setMine(data.mine)
    } catch { /* ignore */ }
  }, [fp])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('prediction_sessions_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prediction_sessions' }, () => load())
      .subscribe()
    const interval = session?.status === 'closed' ? 30_000 : 5_000
    const id = setInterval(load, interval)
    return () => { supabase.removeChannel(channel); clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  if (!session || session.status === 'pending') return null

  const result = session.result
  const hasMine = !!mine
  const exact = result && mine && mine.home_score === result.home && mine.away_score === result.away
  const correctWinner = result && mine && (
    (mine.home_score > mine.away_score && result.home > result.away) ||
    (mine.home_score < mine.away_score && result.home < result.away) ||
    (mine.home_score === mine.away_score && result.home === result.away)
  )

  const meta = session.match_meta

  return (
    <>
      <div className="px-4 pt-3">
        <button className="pred-banner" onClick={() => setSheetOpen(true)}>
          <div className="pred-banner-strp" />
          <div className="pred-banner-tag">
            <span className="pred-banner-dot" />
            <span>Predicción</span>
          </div>
          {meta && (
            <div className="pred-banner-match">
              {meta.home.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.home.logo} alt={meta.home.name} width={14} height={14} className="object-contain" />
              )}
              <span>{meta.home.name}</span>
              <span className="pred-banner-vs">vs</span>
              {meta.away.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.away.logo} alt={meta.away.name} width={14} height={14} className="object-contain" />
              )}
              <span>{meta.away.name}</span>
            </div>
          )}

          <div className="pred-banner-body">
            {session.status === 'open' && !hasMine && (
              <>
                <div className="pred-banner-ic"><IconDice /></div>
                <div className="pred-banner-main">
                  <b>¿Qué crees que pasará?</b>
                  <span>Predice el marcador y suma puntos</span>
                </div>
              </>
            )}
            {session.status === 'open' && hasMine && (
              <>
                <div className="pred-banner-score">
                  <div className="pred-banner-box">{mine.home_score}</div>
                  <div className="pred-banner-colon">:</div>
                  <div className="pred-banner-box">{mine.away_score}</div>
                </div>
                <div className="pred-banner-main">
                  <b>Tu predicción</b>
                  <span>Puedes cambiarla hasta el pitido</span>
                </div>
              </>
            )}
            {session.status === 'closed' && hasMine && (
              <>
                <div className={`pred-banner-result-ic ${exact ? 'hit' : correctWinner ? 'ok' : 'miss'}`}>
                  {exact || correctWinner ? <IconTrophy /> : <IconDice />}
                </div>
                <div className="pred-banner-main">
                  <b>{exact ? '¡Resultado exacto!' : correctWinner ? 'Acertaste el ganador' : `Final: ${result?.home}-${result?.away}`}</b>
                  <span>Tu predicción fue {mine.home_score}-{mine.away_score}</span>
                </div>
              </>
            )}
            {session.status === 'closed' && !hasMine && (
              <>
                <div className="pred-banner-ic"><IconTrophy /></div>
                <div className="pred-banner-main">
                  <b>Partido terminado</b>
                  <span>Ver resultado y ranking</span>
                </div>
              </>
            )}
          </div>

          {session.status === 'open' && !hasMine && (
            <div className="pred-banner-cta">Hacer mi predicción</div>
          )}

          <div className="pred-banner-chev"><IconChevron /></div>
        </button>
      </div>

      {sheetOpen && session && (
        <PredictionSheet
          session={session}
          mine={mine}
          fingerprint={fp}
          onClose={() => setSheetOpen(false)}
          onPredicted={(home, away) => {
            setMine(prev => prev
              ? { ...prev, home_score: home, away_score: away }
              : { id: '', session_id: session.id, fingerprint: fp, home_score: home, away_score: away, points: null, created_at: '' }
            )
            load()
          }}
        />
      )}
    </>
  )
}
