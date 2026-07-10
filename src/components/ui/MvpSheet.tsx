'use client'

import { useState, useEffect } from 'react'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'

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
}

type Tab = 'partido' | 'temporada'
type SeasonEntry = { name: string; wins: number; votes: number }

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

export function MvpSheet({ session, tallies, bannerState, votedId, fingerprint, onClose, onVoted, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('partido')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState<SeasonEntry[]>([])

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
  const leader = sorted[0]
  const rest = sorted.slice(1)

  const votable = bannerState === 'abierta'
  const showResults = bannerState === 'votado' || bannerState === 'cerrada'

  const winner = session.status === 'closed'
    ? session.candidates.find((c) => c.id === session.winner_id) ?? leader
    : leader

  const votedPlayer = session.candidates.find((c) => c.id === votedId)

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
              <div className="mvp-sheet-sub">{session.match_label}</div>
            </div>
            <button className="mvp-close" onClick={onClose}><IconClose /></button>
          </div>
          <div className="mvp-tabs">
            <button className={`mvp-tab${tab === 'partido' ? ' active' : ''}`} onClick={() => setTab('partido')}>Este partido</button>
            <button className={`mvp-tab${tab === 'temporada' ? ' active' : ''}`} onClick={() => setTab('temporada')}>Temporada</button>
          </div>
        </div>

        <div className="mvp-sheet-body">
          {tab === 'temporada' && <SeasonRanking ranking={season} />}

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

          {tab === 'partido' && votable && (
            <>
              <HybridVariant
                candidates={session.candidates}
                total={total}
                getCount={getCount}
                pickedId={pickedId}
                votedId={null}
                onPick={setPickedId}
                votable
              />
              <div className="mvp-ctabar">
                <button className="mvp-cta" disabled={!pickedId || submitting} onClick={handleConfirm}>
                  <IconCheck /> {submitting ? 'Enviando...' : 'Confirmar mi voto'}
                </button>
                <div className="mvp-cta-note">Un voto por aficionado · se cierra a medianoche</div>
              </div>
              {error && <p className="text-[12px] text-red-600 font-semibold mt-2 text-center">{error}</p>}
            </>
          )}

          {tab === 'partido' && bannerState === 'votado' && (
            <>
              <div className="mvp-votedhead">
                <div className="vh-ic"><IconCheck /></div>
                <div>
                  <b>Voto registrado</b>
                  <span>Has votado a {votedPlayer?.name ?? ''}</span>
                </div>
              </div>
              <div className="mvp-livelabel"><span className="ld" />Resultados en directo</div>
              <HybridVariant
                candidates={session.candidates}
                total={total}
                getCount={getCount}
                pickedId={null}
                votedId={votedId}
                onPick={() => {}}
                votable={false}
              />
            </>
          )}

          {tab === 'partido' && bannerState === 'cerrada' && (
            <>
              <div className="mvp-winner">
                <div className="wn-strp" />
                <div className="wn-trophy"><IconTrophy /></div>
                <div className="wn-eye">MVP del partido</div>
                {winner?.photo_url ? (
                  <div className="wn-av">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={winner.photo_url} alt={winner.name} />
                  </div>
                ) : (
                  <div className="wn-av" />
                )}
                <div className="wn-name">{winner?.name}</div>
                <div className="wn-pos">{winner?.position}</div>
                <div className="wn-pct">{pct(getCount(winner?.id ?? ''), total)}% de los votos</div>
              </div>
              <div className="mvp-final-title">Clasificación final del partido</div>
              <HybridVariant
                candidates={session.candidates}
                total={total}
                getCount={getCount}
                pickedId={null}
                votedId={votedId}
                onPick={() => {}}
                votable={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function HybridVariant({
  candidates,
  total,
  getCount,
  pickedId,
  votedId,
  onPick,
  votable,
}: {
  candidates: MvpSession['candidates']
  total: number
  getCount: (id: string) => number
  pickedId: string | null
  votedId: string | null
  onPick: (id: string) => void
  votable: boolean
}) {
  const sorted = [...candidates].sort((a, b) => getCount(b.id) - getCount(a.id))
  const leader = sorted[0]
  const rest = sorted.slice(1)

  const leaderPct = pct(getCount(leader.id), total)
  const leaderPicked = votable ? pickedId === leader.id : votedId === leader.id

  return (
    <div>
      <div className="mvp-leader-label">Líder de la votación</div>
      <div
        className={`fifa-card${leaderPicked ? ' picked' : ''}`}
        onClick={() => votable && onPick(leader.id)}
        style={{ cursor: votable ? 'pointer' : 'default' }}
      >
        <div className="fc-rays" />
        <div className="fc-seam" />
        <div className="fc-shine" />
        <div className="fc-ribbon">MVP</div>
        <div className="fc-top">
          <div>
            <div className="fc-rating">{leaderPct}<span>% votos</span></div>
            <div className="fc-pos">{leader.position}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="" width={22} height={26} style={{ objectFit: 'contain', opacity: 0.85 }} />
        </div>
        <div className="fc-photo">
          {leader.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leader.photo_url} alt={leader.name} />
          ) : (
            <div className="fc-photo-bust" />
          )}
        </div>
        <div className="fc-name-bar">
          <div className="fc-name">{leader.name}</div>
          <div className="fc-divider" />
        </div>
        <div className="fc-stats">
          <div className="fc-stat"><b>#{leader.number}</b><span>Dorsal</span></div>
          <div className="fc-stat"><b>{getCount(leader.id)}</b><span>Votos</span></div>
        </div>
        {leaderPicked && <div className="fc-check"><IconCheck /></div>}
      </div>

      <div className="flex flex-col gap-2">
        {rest.map((c) => {
          const p = pct(getCount(c.id), total)
          const picked = votable ? pickedId === c.id : votedId === c.id
          return (
            <button
              key={c.id}
              className={`mvp-rowmini${picked ? ' picked' : ''}`}
              onClick={() => votable && onPick(c.id)}
              disabled={!votable}
            >
              <div className="rm-av">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 120 150" style={{ display: 'block', width: '100%' }}>
                    <circle cx="60" cy="50" r="25" fill="#CFC9BF" />
                    <path d="M6 150v-30c0-30 24-52 54-52s54 22 54 52v30z" fill="#EDEAE4" />
                  </svg>
                )}
              </div>
              <div className="rm-name">{c.name}</div>
              <div className="rm-pct">{p}%</div>
              <div className="rm-check"><IconCheck /></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
          <div className="sr-main">
            <div className="sr-name">{entry.name}</div>
            <div className="sr-mvps">{entry.wins} {entry.wins === 1 ? 'MVP' : 'MVPs'} de partido</div>
          </div>
          <div className="sr-pts">{entry.votes}<span>votos</span></div>
        </div>
      ))}
    </div>
  )
}
