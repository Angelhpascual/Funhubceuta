'use client'

import { useState, useEffect } from 'react'
import type { MvpSession, MvpVoteTally } from '@/infrastructure/supabase/MvpRepository'

export type BannerState = 'antes' | 'abierta' | 'votado' | 'cerrada'

type Props = {
  session: MvpSession
  tallies: MvpVoteTally[]
  bannerState: BannerState
  fingerprint: string
  onClose: () => void
  onVoted: (sessionId: string) => void
  onRefresh: () => void
}

type Tab = 'partido' | 'temporada'

type SeasonEntry = { name: string; wins: number; votes: number }

export function MvpSheet({ session, tallies, bannerState, fingerprint, onClose, onVoted, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('partido')
  const [selected, setSelected] = useState<string | null>(null)
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

  const totalVotes = tallies.reduce((s, t) => s + t.count, 0)

  const getCount = (candidateId: string) =>
    tallies.find((t) => t.candidate_id === candidateId)?.count ?? 0

  const topCandidateId = tallies.length > 0
    ? tallies.reduce((a, b) => (a.count >= b.count ? a : b)).candidate_id
    : null

  async function handleVote() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/mvp/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, candidateId: selected, fingerprint }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al votar')
        setSubmitting(false)
        return
      }
      onVoted(session.id)
      onRefresh()
    } catch {
      setError('Error de red')
      setSubmitting(false)
    }
  }

  const canVote = bannerState === 'abierta'
  const showResults = bannerState === 'votado' || bannerState === 'cerrada'

  // Find leader for FIFA card
  const leader = session.status === 'closed'
    ? session.candidates.find((c) => c.id === session.winner_id) ?? session.candidates[0]
    : session.candidates.find((c) => c.id === topCandidateId) ?? session.candidates[0]

  return (
    <div className="mvp-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mvp-sheet">
        <div className="mvp-sheet-handle" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-red">MVP del partido</div>
            <div className="text-[18px] font-black uppercase text-ceuta-black leading-tight">{session.match_label}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ceuta-bg-soft flex items-center justify-center text-ceuta-muted">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="chips px-4 pt-3">
          <button className={`chip ${tab === 'partido' ? 'active' : ''}`} onClick={() => setTab('partido')}>
            Este partido
          </button>
          <button className={`chip ${tab === 'temporada' ? 'active' : ''}`} onClick={() => setTab('temporada')}>
            Temporada
          </button>
        </div>

        <div className="mvp-sheet-scroll">
          {tab === 'partido' && (
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Hybrid: FIFA card leader + rows */}
              {showResults && leader && (
                <div className="flex gap-4 items-start">
                  <FifaCard candidate={leader} rank={1} />
                  <div className="flex-1 space-y-2 pt-2">
                    {session.candidates
                      .filter((c) => c.id !== leader.id)
                      .map((c, i) => {
                        const count = getCount(c.id)
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                        return (
                          <div key={c.id} className="mvp-candidate-row !py-2 !px-3 !cursor-default">
                            <span className="text-[11px] font-black text-ceuta-muted w-4 shrink-0">{i + 2}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold uppercase text-ceuta-black leading-tight truncate">{c.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="mvp-vote-bar">
                                  <div className="mvp-vote-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-ceuta-muted shrink-0">{pct}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    <div className="text-[10px] text-ceuta-muted pt-1">{totalVotes} votos totales</div>
                  </div>
                </div>
              )}

              {/* Voting list */}
              {canVote && (
                <div className="space-y-2">
                  {session.candidates.map((c) => (
                    <button
                      key={c.id}
                      className={`mvp-candidate-row w-full ${selected === c.id ? 'selected' : ''}`}
                      onClick={() => setSelected(c.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-ceuta-bg-mid flex items-center justify-center font-black text-ceuta-black text-[14px] shrink-0">
                        {c.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-black uppercase text-ceuta-black leading-tight">{c.name}</div>
                        <div className="text-[10px] text-ceuta-muted">{c.position}</div>
                      </div>
                      {selected === c.id && (
                        <div className="w-5 h-5 rounded-full bg-ceuta-red flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 12 12" fill="white" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  ))}

                  {error && <p className="text-[12px] text-ceuta-red font-semibold">{error}</p>}

                  <button
                    onClick={handleVote}
                    disabled={!selected || submitting}
                    className="w-full py-3.5 rounded-[14px] bg-ceuta-red text-white font-black text-[14px] uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submitting ? 'Enviando...' : 'Votar'}
                  </button>
                </div>
              )}

              {bannerState === 'antes' && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="text-[14px] font-bold text-ceuta-black">La votación abre pronto</div>
                  <div className="text-[12px] text-ceuta-muted mt-1">Espera al pitido final</div>
                </div>
              )}

              {/* Winner announcement */}
              {bannerState === 'cerrada' && session.winner_name && (
                <div className="rounded-[14px] bg-ceuta-gold-soft border border-ceuta-gold px-4 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ceuta-black/60">MVP oficial</div>
                  <div className="text-[20px] font-black uppercase text-ceuta-black">{session.winner_name}</div>
                  <div className="text-[11px] text-ceuta-muted">{session.winner_votes} votos</div>
                </div>
              )}
            </div>
          )}

          {tab === 'temporada' && (
            <div className="px-4 pt-4 pb-6">
              <SeasonRanking ranking={season} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FifaCard({ candidate, rank }: { candidate: MvpSession['candidates'][0]; rank: number }) {
  const ratingDisplay = 90 - (rank - 1) * 3
  return (
    <div className="mvp-fifa-card shrink-0">
      <div className="mvp-fifa-card-rating">{ratingDisplay}</div>
      <div className="mvp-fifa-card-pos">{candidate.position}</div>
      {candidate.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={candidate.photo_url} alt={candidate.name} className="mvp-fifa-card-photo" />
      ) : (
        <div className="mvp-fifa-card-photo-placeholder">⚽</div>
      )}
      <div className="mvp-fifa-card-name">{candidate.name.split(' ').slice(-1)[0]}</div>
      <div className="mvp-fifa-card-divider" />
      <div className="mvp-fifa-card-stats">
        <div className="mvp-fifa-stat">
          <span className="mvp-fifa-stat-val">{candidate.number}</span>
          <span className="mvp-fifa-stat-lbl">Dors.</span>
        </div>
      </div>
    </div>
  )
}

function SeasonRanking({ ranking }: { ranking: SeasonEntry[] }) {
  if (ranking.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🏆</div>
        <div className="text-[14px] font-bold text-ceuta-black">Sin datos aún</div>
        <div className="text-[12px] text-ceuta-muted mt-1">Los MVPs de la temporada aparecerán aquí</div>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-2">
      <div className="sec-title-small mb-3">Ranking temporada</div>
      {ranking.map((entry, i) => (
        <div
          key={entry.name}
          className={`flex items-center gap-3 p-3 rounded-[14px] ${i === 0 ? 'bg-ceuta-gold-soft border border-ceuta-gold' : i === 1 ? 'bg-gray-50 border border-gray-200' : i === 2 ? 'bg-orange-50 border border-orange-200' : 'bg-ceuta-bg-soft'}`}
        >
          <span className="text-xl w-7 text-center shrink-0">{medals[i] ?? `${i + 1}`}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black uppercase text-ceuta-black leading-tight">{entry.name}</div>
            <div className="text-[10px] text-ceuta-muted">{entry.votes} votos totales</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[18px] font-black text-ceuta-black leading-none">{entry.wins}</div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-ceuta-muted">MVPs</div>
          </div>
        </div>
      ))}
    </div>
  )
}
