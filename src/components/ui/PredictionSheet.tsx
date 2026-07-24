'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PredictionSession, UserPrediction } from '@/domain/predictions/PredictionSession'

type Tab = 'partido' | 'ranking'
type SeasonEntry = { fingerprint: string; nickname: string | null; points: number; exactos: number }

function getNickname(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('pred_nickname') : null
}
function saveNickname(n: string) {
  localStorage.setItem('pred_nickname', n)
}

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
)
const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
)
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
const IconCross = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

type Props = {
  session: PredictionSession
  mine: UserPrediction | null
  fingerprint: string
  onClose: () => void
  onPredicted: (home: number, away: number) => void
}

function ScorePicker({ home, setHome, away, setAway, session }: {
  home: number; setHome: (n: number) => void
  away: number; setAway: (n: number) => void
  session: PredictionSession
}) {
  const meta = session.match_meta
  return (
    <div className="pred-picker">
      <div className="pred-picker-teams">
        <div className="pred-picker-team">
          {meta?.home.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={meta.home.logo} alt={meta.home.name} className="pred-picker-badge" />
            : <div className="pred-picker-badge pred-picker-badge-empty" />
          }
          <span>{meta?.home.name ?? 'Local'}</span>
        </div>
        <div className="pred-picker-vs">vs</div>
        <div className="pred-picker-team">
          {meta?.away.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={meta.away.logo} alt={meta.away.name} className="pred-picker-badge" />
            : <div className="pred-picker-badge pred-picker-badge-empty" />
          }
          <span>{meta?.away.name ?? 'Visitante'}</span>
        </div>
      </div>
      <div className="pred-picker-controls">
        <div className="pred-picker-stepper">
          <button className="pred-step-btn" onClick={() => setHome(Math.min(9, home + 1))}><IconPlus /></button>
          <div className="pred-step-value">{home}</div>
          <button className="pred-step-btn" onClick={() => setHome(Math.max(0, home - 1))}><IconMinus /></button>
        </div>
        <div className="pred-picker-colon">:</div>
        <div className="pred-picker-stepper">
          <button className="pred-step-btn" onClick={() => setAway(Math.min(9, away + 1))}><IconPlus /></button>
          <div className="pred-step-value">{away}</div>
          <button className="pred-step-btn" onClick={() => setAway(Math.max(0, away - 1))}><IconMinus /></button>
        </div>
      </div>
    </div>
  )
}

function ScoreDisplay({ session, mine, isResult }: {
  session: PredictionSession
  mine: { home: number; away: number }
  isResult?: boolean
}) {
  const meta = session.match_meta
  return (
    <div className="pred-score-display">
      <div className="pred-score-display-teams">
        <div className="pred-picker-team">
          {meta?.home.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={meta.home.logo} alt={meta.home.name} className="pred-picker-badge sm" />
            : <div className="pred-picker-badge sm pred-picker-badge-empty" />
          }
          <span>{meta?.home.name ?? 'Local'}</span>
        </div>
        <div className="pred-score-boxes">
          <div className={`pred-score-box${isResult ? ' dark' : ''}`}>{mine.home}</div>
          <div className="pred-score-colon">:</div>
          <div className={`pred-score-box${isResult ? ' dark' : ''}`}>{mine.away}</div>
        </div>
        <div className="pred-picker-team">
          {meta?.away.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={meta.away.logo} alt={meta.away.name} className="pred-picker-badge sm" />
            : <div className="pred-picker-badge sm pred-picker-badge-empty" />
          }
          <span>{meta?.away.name ?? 'Visitante'}</span>
        </div>
      </div>
    </div>
  )
}

function SeasonRanking({ ranking }: { ranking: SeasonEntry[] }) {
  if (ranking.length === 0) {
    return (
      <div className="pred-empty">
        <div className="pred-empty-ic">
          <IconDice />
        </div>
        <h3>Sin datos aún</h3>
        <p>El ranking aparecerá cuando se cierren las primeras predicciones.</p>
      </div>
    )
  }
  return (
    <div className="pred-season">
      {ranking.map((entry, i) => (
        <div key={entry.fingerprint} className={`pred-srow${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}>
          <div className="pred-sr-pos">{i + 1}</div>
          <div className="pred-sr-main">
            <div className="pred-sr-name">@{entry.nickname ?? `aficionado${i + 1}`}</div>
            <div className="pred-sr-exact">{entry.exactos} {entry.exactos === 1 ? 'exacto' : 'exactos'} esta temporada</div>
          </div>
          <div className="pred-sr-pts">{entry.points}<span>puntos</span></div>
        </div>
      ))}
    </div>
  )
}

export function PredictionSheet({ session, mine, fingerprint, onClose, onPredicted }: Props) {
  const [tab, setTab] = useState<Tab>('partido')
  const [pickerHome, setPickerHome] = useState(mine?.home_score ?? 0)
  const [pickerAway, setPickerAway] = useState(mine?.away_score ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ranking, setRanking] = useState<SeasonEntry[]>([])
  const [editing, setEditing] = useState(false)
  const [askNickname, setAskNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (tab === 'ranking') {
      fetch('/api/predictions/season').then(r => r.json()).then(d => setRanking(d.ranking ?? [])).catch(() => {})
    }
  }, [tab])

  const votable = session.status === 'open'
  const hasMine = !!mine
  const result = session.result

  const exact = result && mine && mine.home_score === result.home && mine.away_score === result.away
  const correctWinner = result && mine && (
    (mine.home_score > mine.away_score && result.home > result.away) ||
    (mine.home_score < mine.away_score && result.home < result.away) ||
    (mine.home_score === mine.away_score && result.home === result.away)
  )
  const points = exact ? 50 : correctWinner ? 15 : 0

  async function doSubmit(nickname: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/predictions/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, fingerprint, home: pickerHome, away: pickerAway, nickname }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); setSubmitting(false); return }
      onPredicted(pickerHome, pickerAway)
      setEditing(false)
      setAskNickname(false)
    } catch {
      setError('Error de red')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit() {
    const saved = getNickname()
    if (saved) {
      doSubmit(saved)
    } else {
      setAskNickname(true)
    }
  }

  function handleNicknameConfirm() {
    const n = nicknameInput.trim()
    if (!n) return
    saveNickname(n)
    doSubmit(n)
  }

  const showPicker = votable && (!hasMine || editing)

  return (
    <div className="pred-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pred-sheet">
        <div className="pred-sheet-grab" />

        <div className="pred-sheet-head">
          <div className="pred-sheet-top">
            <div>
              <div className="pred-sheet-title">TU <span>QUINIELA</span></div>
              <div className="pred-sheet-sub">
                {session.match_meta ? (
                  <>
                    {session.match_meta.home.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.match_meta.home.logo} alt={session.match_meta.home.name} />
                    )}
                    {session.match_meta.home.name}
                    <span className="sub-vs">VS</span>
                    {session.match_meta.away.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.match_meta.away.logo} alt={session.match_meta.away.name} />
                    )}
                    {session.match_meta.away.name}
                  </>
                ) : session.match_label}
                {session.jornada && <span className="pred-jornada">{session.jornada}</span>}
              </div>
            </div>
            <button className="pred-close" onClick={onClose}><IconClose /></button>
          </div>
          <div className="pred-tabs">
            <button className={`pred-tab${tab === 'partido' ? ' active' : ''}`} onClick={() => setTab('partido')}>Este partido</button>
            <button className={`pred-tab${tab === 'ranking' ? ' active' : ''}`} onClick={() => setTab('ranking')}>Ranking</button>
          </div>
        </div>

        <div className="pred-sheet-body">
          {tab === 'ranking' && <SeasonRanking ranking={ranking} />}

          {tab === 'partido' && session.status === 'pending' && (
            <div className="pred-empty">
              <div className="pred-empty-ic"><svg viewBox="0 0 24 24" fill="none" width="28" height="28"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
              <h3>Aún no está abierta</h3>
              <p>La predicción se abre antes del pitido inicial.</p>
            </div>
          )}

          {tab === 'partido' && showPicker && !askNickname && (
            <>
              <ScorePicker home={pickerHome} setHome={setPickerHome} away={pickerAway} setAway={setPickerAway} session={session} />
              <button
                className="pred-cta-btn"
                disabled={submitting}
                onClick={handleSubmit}
              >
                <IconCheck /> {submitting ? 'Enviando...' : hasMine ? 'Guardar cambio' : 'Enviar predicción'}
              </button>
              <p className="pred-note">Una predicción por jornada · se cierra al pitido inicial</p>
              {error && <p className="pred-error">{error}</p>}
            </>
          )}

          {tab === 'partido' && askNickname && (
            <div className="pred-nickname-wrap">
              <div className="pred-nickname-ic"><IconDice /></div>
              <h3 className="pred-nickname-title">¿Cómo te llamas?</h3>
              <p className="pred-nickname-sub">Tu apodo aparecerá en el ranking de la temporada</p>
              <input
                className="pred-nickname-input"
                placeholder="Tu apodo…"
                maxLength={24}
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNicknameConfirm()}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <button
                className="pred-cta-btn"
                disabled={!nicknameInput.trim() || submitting}
                onClick={handleNicknameConfirm}
              >
                <IconCheck /> {submitting ? 'Enviando...' : 'Confirmar y enviar'}
              </button>
              <button className="pred-cta-btn ghost mt-2" onClick={() => setAskNickname(false)}>
                Volver
              </button>
              {error && <p className="pred-error">{error}</p>}
            </div>
          )}

          {tab === 'partido' && votable && hasMine && !editing && (
            <>
              <div className="pred-submitted-label">Tu predicción</div>
              <ScoreDisplay session={session} mine={{ home: mine.home_score, away: mine.away_score }} />
              <button className="pred-cta-btn ghost" onClick={() => setEditing(true)}>
                <IconDice /> Cambiar predicción
              </button>
              <p className="pred-note">Puedes cambiarla hasta el pitido inicial</p>
            </>
          )}

          {tab === 'partido' && session.status === 'closed' && mine && result && (
            <>
              <div className="pred-closed-wrap">
                <div className="pred-submitted-label">Resultado final</div>
                <ScoreDisplay session={session} mine={{ home: result.home, away: result.away }} isResult />

                <div className="pred-vs-result">
                  <div className="pred-vs-col">
                    <div className="pred-vs-label">Tu predicción</div>
                    <div className="pred-vs-score mine">{mine.home_score}-{mine.away_score}</div>
                  </div>
                  <div className="pred-vs-col">
                    <div className="pred-vs-label">Resultado</div>
                    <div className="pred-vs-score">{result.home}-{result.away}</div>
                  </div>
                </div>

                <div className={`pred-points ${points > 0 ? 'hit' : 'miss'}`}>
                  <div className="pred-pts-big">{points > 0 ? `+${points}` : '+0'}</div>
                  <div className="pred-pts-label">
                    {exact ? 'Resultado exacto 🎯' : correctWinner ? 'Acertaste el ganador' : 'Sin acierto esta vez'}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'partido' && session.status === 'closed' && !mine && (
            <div className="pred-empty">
              <div className="pred-empty-ic"><IconCross /></div>
              <h3>No participaste</h3>
              <p>No enviaste predicción para este partido.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
