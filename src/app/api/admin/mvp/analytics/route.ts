import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'
import { APP_ENV } from '@/lib/appEnv'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const [seasonRanking, { data: sessions }, { data: events }] = await Promise.all([
    getMvpSeasonRanking(),
    supabaseAdmin
      .from('mvp_sessions')
      .select('id, match_label, status, winner_name, winner_votes, opened_at, closed_at')
      .eq('environment', APP_ENV)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('mvp_events')
      .select('session_id, event, fingerprint, created_at')
      .eq('environment', APP_ENV)
      .order('created_at', { ascending: true }),
  ])

  // analytics por sesión
  const sessionAnalytics = (sessions ?? []).map(s => {
    const sEvents = (events ?? []).filter(e => e.session_id === s.id)
    const clicks    = sEvents.filter(e => e.event === 'banner_click').length
    const opens     = sEvents.filter(e => e.event === 'sheet_open').length
    const voteCasts = sEvents.filter(e => e.event === 'vote_cast').length

    // votos reales de la tabla mvp_votes (se calculan aparte — aquí usamos events como proxy)
    // detección de amaño: si >40% de eventos ocurrieron en menos de 2 minutos
    const voteEvents = sEvents.filter(e => e.event === 'vote_cast')
    let suspicious = false
    if (voteEvents.length >= 5) {
      // ventana deslizante de 2 min
      for (let i = 0; i < voteEvents.length; i++) {
        const t0 = new Date(voteEvents[i].created_at).getTime()
        const burst = voteEvents.filter(e => {
          const t = new Date(e.created_at).getTime()
          return t >= t0 && t <= t0 + 120_000
        }).length
        if (burst / voteEvents.length > 0.4) { suspicious = true; break }
      }
    }

    // fingerprints únicos
    const uniqueFp = new Set(voteEvents.map(e => e.fingerprint).filter(Boolean)).size

    return { ...s, clicks, opens, voteCasts, suspicious, uniqueVoters: uniqueFp }
  })

  return NextResponse.json({ seasonRanking, sessions: sessionAnalytics })
})
