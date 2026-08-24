'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'
import { FifaCard } from './FifaCard'

export type BannerState = 'antes' | 'abierta' | 'votado' | 'cerrada'

type Props = {
  session: MvpSession
  tallies: MvpVoteTally[]
  bannerState: BannerState
  votedId: string | null
  fingerprint: string
  onClose: () => void
  onVoted: (sessionId: string, candidateId: string) => void
  onRefresh: () => void
  onOpen?: () => void
  startInChangeMode?: boolean
}

type Tab = 'partido' | 'temporada'
type SeasonEntry = { name: string; wins: number; votes: number; photo_url: string | null }

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M6 9V4h12v5a6 6 0 01-12 0zM4 6h2M18 6h2M9 20h6M12 15v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function pct(votes: number, total: number) {
  if (total === 0) return 0
  return Math.round((votes / total) * 100)
}

export function MvpSheet({ session, tallies, bannerState, votedId, fingerprint, onClose, onVoted, onRefresh, onOpen, startInChangeMode }: Props) {
  const [tab, setTab] = useState<Tab>('partido')
  const [pickedId, setPickedId] = useState<string | null>(startInChangeMode ? votedId : null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState<SeasonEntry[]>([])
  const [changingVote, setChangingVote] = useState(!!startInChangeMode)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    onOpen?.()
    return () => { document.body.style.overflow = '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'temporada') {
      fetch('/api/mvp/season')
        .then((r) => r.json())
        .then((d) => setSeason(d.ranking ?? []))
        .catch(() => {})
    }
  }, [tab])

  const total = tallies.reduce((s, t) => s + t.count, 0)
  const getCount = (id: string) => tallies.find((t) => t.candidate_id === id)?.count ?? 0

  const sorted = [...session.candidates].sort((a, b) => getCount(b.id) - getCount(a.id))

  const winner = session.status === 'closed'
    ? session.candidates.find((c) => c.id === session.winner_id) ?? sorted[0]
    : sorted[0]

  const votedPlayer = session.candidates.find((c) => c.id === votedId)

  const votable = bannerState === 'abierta' || changingVote

  async function handleConfirm() {
    if (!pickedId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/mvp/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, candidateId: pickedId, fingerprint }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al votar')
        setSubmitting(false)
        return
      }
      onVoted(session.id, pickedId)
      onRefresh()
      setChangingVote(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const umami = typeof window !== 'undefined' ? (window as any).umami : null
      if (umami?.track) {
        umami.track('mvp_vote', { session_id: session.id, candidate_id: pickedId })
      }
    } catch {
      setError('Error de red')
      setSubmitting(false)
    }
  }

  return (
    <div className="mvp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mvp-sheet">
        <div className="mvp-sheet-grab" />

        <div className="mvp-sheet-head">
          <div className="mvp-sheet-top">
            <div>
              <div className="mvp-sheet-title">MVP DEL <span>PARTIDO</span></div>
              <div className="mvp-sheet-sub">
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
            </div>
            </div>
            <button type="button" className="mvp-close" onClick={onClose}><IconClose /></button>
          </div>
          <div className="mvp-tabs">
            <button type="button" className={`mvp-tab${tab === 'partido' ? ' active' : ''}`} onClick={() => setTab('partido')}>Este partido</button>
            <button type="button" className={`mvp-tab${tab === 'temporada' ? ' active' : ''}`} onClick={() => setTab('temporada')}>Temporada</button>
          </div>
        </div>

        <div className="mvp-sheet-body">

          {tab === 'temporada' && <SeasonRanking ranking={season} />}

          {/* ANTES */}
          {tab === 'partido' && bannerState === 'antes' && (
            <div className="mvp-before">
              <div className="bef-ic">
                <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Aún no se puede votar</h3>
              <p>La votación al MVP del partido se abre en cuanto suena el pitido final.</p>
              <div className="bef-when">Se abre · al final del partido</div>
            </div>
          )}

          {/* ABIERTA — lista con fotos */}
          {tab === 'partido' && votable && (
            <>
              <div className="mvp-list">
                {session.candidates.map((c) => (
                  <PlayerCard
                    key={c.id}
                    candidate={c}
                    picked={pickedId === c.id}
                    showBar={false}
                    pctValue={0}
                    onClick={() => setPickedId(c.id)}
                    votable
                  />
                ))}
              </div>
              <div className="mvp-ctabar">
                <button type="button" className="mvp-cta" disabled={!pickedId || submitting} onClick={handleConfirm}>
                  <IconCheck /> {submitting ? 'Enviando...' : changingVote ? 'Confirmar cambio' : 'Confirmar mi voto'}
                </button>
                {changingVote ? (
                  <p onClick={() => { setChangingVote(false); setError(null) }} className="mvp-cta-note mvp-cta-note-link">
                    Cancelar cambio
                  </p>
                ) : (
                  <div className="mvp-cta-note">Un voto por aficionado · se cierra a medianoche</div>
                )}
              </div>
              {error && <p className="text-[12px] text-red-600 font-semibold mt-2 text-center">{error}</p>}
            </>
          )}

          {/* VOTADO — lista con resultados */}
          {tab === 'partido' && bannerState === 'votado' && !changingVote && (
            <>
              <div className="mvp-votedhead">
                <div className="vh-ic"><IconCheck /></div>
                <div>
                  <b>Voto registrado</b>
                  <span>Has votado a {votedPlayer?.name ?? ''}</span>
                </div>
              </div>
              <div className="mvp-livelabel"><span className="ld" />Resultados en directo</div>
              <div className="mvp-list">
                {sorted.map((c) => (
                  <PlayerCard
                    key={c.id}
                    candidate={c}
                    picked={votedId === c.id}
                    showBar
                    pctValue={pct(getCount(c.id), total)}
                    onClick={() => {}}
                    votable={false}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setPickedId(votedId); setChangingVote(true) }}
                className="mvp-cta mvp-cta-ghost"
              >
                Cambiar voto
              </button>
            </>
          )}

          {/* CERRADA — FIFA card ganador + lista resultados */}
          {tab === 'partido' && bannerState === 'cerrada' && (
            <>
              {winner && (
                <FifaCard
                  candidate={winner}
                  votePct={pct(getCount(winner.id), total)}
                  voteCount={getCount(winner.id)}
                />
              )}
              <div className="mvp-final-title">Clasificación final del partido</div>
              <div className="mvp-list">
                {sorted.map((c) => (
                  <PlayerCard
                    key={c.id}
                    candidate={c}
                    picked={c.id === winner?.id}
                    showBar
                    pctValue={pct(getCount(c.id), total)}
                    onClick={() => {}}
                    votable={false}
                  />
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

/* ——— tarjeta jugador con foto integrada ——— */
function PlayerCard({
  candidate,
  picked,
  showBar,
  pctValue,
  onClick,
  votable,
}: {
  candidate: MvpSession['candidates'][0]
  picked: boolean
  showBar: boolean
  pctValue: number
  onClick: () => void
  votable: boolean
}) {
  return (
    <button type="button"
      className={`mvp-row${picked ? ' picked' : ''}`}
      onClick={onClick}
      disabled={!votable}
    >
      {/* foto integrada con fondo oscuro + gradiente */}
      <div className="mvp-row-photo relative">
        {candidate.photo_url ? (
          <Image src={candidate.photo_url} alt={candidate.name} fill sizes="64px" className="mvp-row-photo-img object-cover object-top" />
        ) : (
          <svg viewBox="0 0 120 150" className="mvp-row-photo-bust">
            <circle cx="60" cy="50" r="25" fill="#CFC9BF" />
            <path d="M6 150v-30c0-30 24-52 54-52s54 22 54 52v30z" fill="#EDEAE4" />
          </svg>
        )}
        <div className="mvp-row-photo-fade" />
      </div>

      <div className="rw-main">
        <div className="rw-name">
          {candidate.name}
          <span className="rw-dorsal">#{candidate.number}</span>
        </div>
        <div className="rw-pos">{candidate.position}</div>
        {showBar && (
          <div className="rw-bar">
            <span className="rw-bar-fill" style={{ ['--bar-w' as string]: `${pctValue}%` }} />
          </div>
        )}
      </div>

      {showBar && <div className="rw-pct">{pctValue}%</div>}
      <div className="rw-check"><IconCheck /></div>
    </button>
  )
}

/* ——— ranking temporada ——— */
function SeasonRanking({ ranking }: { ranking: SeasonEntry[] }) {
  if (ranking.length === 0) {
    return (
      <div className="mvp-before">
        <div className="bef-ic"><IconTrophy /></div>
        <h3>Sin datos aún</h3>
        <p>Los MVPs de la temporada aparecerán aquí al cerrar las votaciones.</p>
      </div>
    )
  }
  return (
    <div className="mvp-season">
      {ranking.map((entry, i) => (
        <div key={entry.name} className={`mvp-srow${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}>
          <div className="sr-pos">{i + 1}</div>
          <div className="sr-photo relative">
            {entry.photo_url
              ? <Image src={entry.photo_url} alt={entry.name} fill sizes="40px" className="object-cover object-top" />
              : <div className="sr-photo-placeholder" />
            }
          </div>
          <div className="sr-main">
            <div className="sr-name">{entry.name}</div>
            <div className="sr-mvps">
              {Array.from({ length: entry.wins }).map((_, j) => (
                <span key={j} className="sr-star">⭐</span>
              ))}
              <span className="sr-wins-label">{entry.wins} {entry.wins === 1 ? 'MVP' : 'MVPs'}</span>
            </div>
          </div>
          <div className="sr-pts">{entry.votes}<span>votos</span></div>
        </div>
      ))}
    </div>
  )
}
