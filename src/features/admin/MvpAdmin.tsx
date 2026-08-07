'use client'

import { useState, useEffect } from 'react'
import { MvpActiveSession } from './mvp/MvpActiveSession'
import { MvpCreateForm } from './mvp/MvpCreateForm'
import { MvpHistory } from './mvp/MvpHistory'
import { MvpSeasonRanking } from './mvp/MvpSeasonRanking'
import { MvpAnalytics } from './mvp/MvpAnalytics'

type Candidate = { id: string; name: string; number: number; position: string; photo_url?: string }
type Session = {
  id: string
  match_label: string
  match_meta: { home: { name: string; logo: string | null }; away: { name: string; logo: string | null } } | null
  status: 'pending' | 'open' | 'closed'
  winner_name: string | null
  winner_votes: number | null
  candidates: Candidate[]
  opened_at: string | null
  closed_at: string | null
}
type VoteTally = { candidate_id: string; count: number }
type MvpVote = { candidate_id: string; candidate_name: string; fingerprint: string; created_at: string }
type HistoryEntry = { id: string; match_label: string; winner_name: string | null; winner_votes: number | null; closed_at: string | null; votes: MvpVote[] }
type SeasonEntry = { name: string; wins: number; votes: number; photo_url: string | null }
type SessionAnalytic = { id: string; match_label: string; status: string; winner_name: string | null; winner_votes: number | null; clicks: number; opens: number; voteCasts: number; suspicious: boolean; uniqueVoters: number }
type SquadPlayer = { id: string; name: string; dorsal: number; position: string; position_group: string; photo_url?: string }

export function MvpAdmin() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [tallies, setTallies] = useState<VoteTally[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [seasonRanking, setSeasonRanking] = useState<SeasonEntry[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalytic[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [matchLabel, setMatchLabel] = useState('')
  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [awayName, setAwayName] = useState('')
  const [awayLogo, setAwayLogo] = useState<string | null>(null)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [ceutaHome, setCeutaHome] = useState(true)

  async function load() {
    try {
      const [activeRes, histRes, analyticsRes] = await Promise.all([
        fetch('/api/mvp/active'),
        fetch('/api/admin/mvp/history'),
        fetch('/api/admin/mvp/analytics'),
      ])
      const activeData = await activeRes.json()
      const histData = histRes.ok ? await histRes.json() : {}
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : {}
      setActiveSession(activeData.session)
      setTallies(activeData.tallies ?? [])
      setHistory(histData.history ?? [])
      setSeasonRanking(histData.seasonRanking ?? analyticsData.seasonRanking ?? [])
      setAnalytics(analyticsData.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function loadSquad() {
    try {
      const res = await fetch('/api/squad')
      const data = await res.json()
      const players: SquadPlayer[] = (data.grouped ?? []).flatMap((g: { players: SquadPlayer[] }) => g.players)
      setSquad(players)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (creating) loadSquad() }, [creating])

  async function apiCall(path: string, method: string, body: unknown) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) {
        setMsg(`✗ ${data.error ?? 'Error desconocido'}`)
      } else {
        setMsg('✓ Hecho')
        await load()
        resetCreateForm()
        setTimeout(() => setMsg(null), 3000)
      }
    } catch {
      setMsg('✗ Error de red')
    } finally {
      setBusy(false)
    }
  }

  function resetCreateForm() {
    setCreating(false)
    setSelectedIds(new Set())
    setMatchLabel('')
    setAwayName('')
    setAwayLogo(null)
    setShowLogoPicker(false)
  }

  const totalVotes = tallies.reduce((a, t) => a + t.count, 0)

  if (loading) return <div className="text-[12px] text-ceuta-muted py-4 text-center">Cargando...</div>

  return (
    <div className="space-y-4">
      {activeSession && (
        <MvpActiveSession
          session={activeSession}
          tallies={tallies}
          totalVotes={totalVotes}
          busy={busy}
          onAction={apiCall}
        />
      )}

      {msg && (
        <div className={`text-[12px] font-semibold px-3 py-2 rounded-xl ${msg.startsWith('✓') ? 'bg-[#E7F6EC] text-[#1E9E4B]' : 'bg-red-50 text-ceuta-red'}`}>
          {msg}
        </div>
      )}

      {(!activeSession || activeSession.status === 'closed') && (
        creating ? (
          <MvpCreateForm
            squad={squad}
            busy={busy}
            ceutaHome={ceutaHome}
            awayName={awayName}
            awayLogo={awayLogo}
            matchLabel={matchLabel}
            selectedIds={selectedIds}
            showLogoPicker={showLogoPicker}
            onCeutaHomeToggle={() => {
              const next = !ceutaHome
              setCeutaHome(next)
              if (awayName) setMatchLabel(next ? `AD Ceuta vs ${awayName}` : `${awayName} vs AD Ceuta`)
            }}
            onAwayChange={(name, logo) => {
              setAwayName(name)
              setMatchLabel(name ? (ceutaHome ? `AD Ceuta vs ${name}` : `${name} vs AD Ceuta`) : '')
              setAwayLogo(logo)
            }}
            onMatchLabelChange={setMatchLabel}
            onTogglePlayer={(id) => setSelectedIds(prev => {
              const next = new Set(prev)
              next.has(id) ? next.delete(id) : next.add(id)
              return next
            })}
            onClearSelection={() => setSelectedIds(new Set())}
            onToggleLogoPicker={() => setShowLogoPicker(p => !p)}
            onSelectLogo={(logo) => { setAwayLogo(logo); setShowLogoPicker(false) }}
            onCancel={resetCreateForm}
            onSubmit={(candidates, label, matchMeta) =>
              apiCall('/api/admin/mvp/session', 'POST', { matchLabel: label, candidates, matchMeta })
            }
          />
        ) : (
          <button type="button" onClick={() => { setCreating(true); setMsg(null) }}
            className="w-full py-3 rounded-xl border-[1.5px] border-dashed border-ceuta-border font-display text-[12px] font-bold tracking-[0.1em] uppercase text-ceuta-muted hover:border-ceuta-black hover:text-ceuta-black transition-colors">
            + Nueva votación MVP
          </button>
        )
      )}

      <MvpHistory
        history={history}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
      />

      <MvpSeasonRanking ranking={seasonRanking} />

      <MvpAnalytics analytics={analytics} />
    </div>
  )
}
