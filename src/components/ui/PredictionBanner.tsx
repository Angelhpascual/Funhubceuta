'use client'

import { useState, useEffect, useCallback } from 'react'
import { PredictionSheet } from './PredictionSheet'
import { supabase } from '@/infrastructure/supabase/client'
import type { PredictionSession, UserPrediction } from '@/domain/predictions/PredictionSession'
import { getLocalLogo } from '@/lib/teamLogos'
import { getFingerprint } from '@/lib/fingerprint'

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M6 9V4h12v5a6 6 0 01-12 0zM4 6h2M18 6h2M9 20h6M12 15v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    // No session → check every 10 min (realtime fires if one opens); closed → 2 min; open → 1 min
    const interval = !session ? 600_000 : session.status === 'closed' ? 120_000 : 60_000
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
  function logoFor(name: string | undefined, url: string | null | undefined) {
    return getLocalLogo(name) ?? url ?? null
  }


  const homeScore = hasMine ? mine.home_score : null
  const awayScore = hasMine ? mine.away_score : null

  const footerTitle = session.status === 'closed'
    ? exact ? '¡Resultado exacto!' : correctWinner ? 'Acertaste el ganador' : hasMine ? `Final: ${result?.home}-${result?.away}` : 'Partido terminado'
    : hasMine ? 'Tu predicción' : '¿Qué crees que pasará?'

  const footerSub = session.status === 'closed'
    ? hasMine ? `Tu predicción fue ${mine.home_score}-${mine.away_score}` : 'Ver resultado y ranking'
    : hasMine ? 'Puedes cambiarla hasta el pitido' : 'Predice el marcador y suma puntos'

  const ctaLabel = session.status === 'closed' ? 'Ver ranking' : hasMine ? 'Cambiar' : 'Predecir'

  return (
    <>
      <div className="px-4 pt-5 pb-1">
        <div className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-red mb-1">
          Tu predicción
        </div>
        <div className="font-display text-[22px] font-black uppercase leading-tight text-ceuta-black">
          Predice el resultado
        </div>
      </div>
      <div className="px-4 pt-3">
        <button className="pred-banner" onClick={() => setSheetOpen(true)}>
          <div className="pred-banner-strp" />

          {/* tag + jornada */}
          <div className="pred-banner-header">
            <div className="pred-banner-tag">
              <span className="pred-banner-dot" />
              <span>Predicción</span>
            </div>
            {session.jornada && <div className="pred-banner-jornada">{session.jornada}</div>}
          </div>

          {/* teams + score picker */}
          <div className="pred-banner-teams">
            <div className="pred-banner-team">
              <div className={`pred-banner-logo`}>
                {logoFor(meta?.home.name, meta?.home.logo)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logoFor(meta?.home.name, meta?.home.logo)!} alt={meta?.home.name} width={40} height={40} className="object-contain" />
                  : <span className="pred-banner-logo-init">{meta?.home.name?.[0] ?? '?'}</span>}
              </div>
              <span className="pred-banner-team-name">{meta?.home.name ?? 'Local'}</span>
            </div>

            <div className="pred-banner-scorecenter">
              <div className={`pred-banner-box${homeScore == null ? ' pred-banner-box--empty' : ''}`}>
                {homeScore != null ? homeScore : '—'}
              </div>
              <div className="pred-banner-colon">:</div>
              <div className={`pred-banner-box${awayScore == null ? ' pred-banner-box--empty' : ''}`}>
                {awayScore != null ? awayScore : '—'}
              </div>
            </div>

            <div className="pred-banner-team">
              <div className={`pred-banner-logo`}>
                {logoFor(meta?.away.name, meta?.away.logo)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logoFor(meta?.away.name, meta?.away.logo)!} alt={meta?.away.name} width={40} height={40} className="object-contain" />
                  : <span className="pred-banner-logo-init">{meta?.away.name?.[0] ?? '?'}</span>}
              </div>
              <span className="pred-banner-team-name">{meta?.away.name ?? 'Visitante'}</span>
            </div>
          </div>

          {/* divider */}
          <div className="pred-banner-divider" />

          {/* footer */}
          <div className="pred-banner-footer">
            <div className="pred-banner-footer-text">
              <b>{footerTitle}</b>
              <span>{footerSub}</span>
            </div>
            <div className="pred-banner-cta-pill">
              {ctaLabel} <span className="pred-banner-cta-chev">›</span>
            </div>
          </div>
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
