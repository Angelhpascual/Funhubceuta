import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import type { ScrapedMatch, ScrapedResult } from '@/infrastructure/scrapers/adceutaScraper'
import { CURRENT_MATCH_SEASON, COMPETITION } from '@/lib/constants'
import { deduplicateMatches } from '@/lib/deduplicateMatches'

export class MatchesSupabaseRepository {
  async upsertResults(results: ScrapedResult[]): Promise<void> {
    if (results.length === 0) return
    const { error } = await supabaseAdmin.from('matches').upsert(
      results.map((r) => ({
        external_id: `result-${r.date}-${r.homeTeam}-${r.awayTeam}`.toLowerCase().replace(/\s+/g, '-'),
        home_team: r.homeTeam,
        away_team: r.awayTeam,
        date: r.date,
        time: '',
        weekday: r.weekday,
        is_home: r.isHome,
        tickets_url: null,
        status: 'finished',
        season: CURRENT_MATCH_SEASON,
        competition: COMPETITION,
        home_score: r.homeScore,
        away_score: r.awayScore,
        result: r.result,
        espn_event_id: r.espnEventId,
      })),
      { onConflict: 'external_id', ignoreDuplicates: false }
    )
    if (error) throw new Error(`Failed to upsert results: ${error.message}`)
  }

  async upsertMatches(matches: ScrapedMatch[]): Promise<void> {
    if (matches.length === 0) return

    // Delete existing scheduled matches and replace with fresh data
    await supabaseAdmin.from('matches').delete().eq('status', 'scheduled')

    const { error } = await supabaseAdmin.from('matches').insert(
      matches.map((m) => ({
        external_id: `${m.date}-${m.homeTeam}-${m.awayTeam}`.toLowerCase().replace(/\s+/g, '-'),
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        date: m.date,
        time: m.time,
        weekday: m.weekday,
        is_home: m.isHome,
        tickets_url: m.ticketsUrl,
        status: 'scheduled',
        season: CURRENT_MATCH_SEASON,
        competition: COMPETITION,
        espn_event_id: m.espnEventId,
      }))
    )

    if (error) throw new Error(`Failed to upsert matches: ${error.message}`)
  }

  async fetchBySeason(season: string, limit = 60) {
    const { data } = await supabase
      .from('matches')
      .select('id, external_id, home_team, away_team, date, time, weekday, is_home, tickets_url, status, season, competition, home_score, away_score, result, espn_event_id, matchday')
      .eq('season', season)
      .order('date', { ascending: false })
      .limit(limit)
    return deduplicateMatches(data ?? [])
  }

  async fetchSeasonMatches(season: string) {
    const matches = await this.fetchBySeason(season)
    const today = new Date().toISOString().split('T')[0]
    const upcoming = matches
      .filter((r) => r.status === 'scheduled' && String(r.date).slice(0, 10) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    const results = matches
      .filter((r) => r.status === 'finished' || (r.status === 'scheduled' && String(r.date).slice(0, 10) < today))
      .sort((a, b) => b.date.localeCompare(a.date))
    return { upcoming, results }
  }

  async fetchByEspnId(espnId: string): Promise<{ date: string } | null> {
    const { data } = await supabase
      .from('matches')
      .select('date')
      .eq('espn_event_id', espnId)
      .maybeSingle()
    return data ?? null
  }

  async getNextMatch(): Promise<ScrapedMatch | null> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('matches')
      .select('home_team, away_team, date, time, weekday, is_home, tickets_url, espn_event_id')
      .eq('status', 'scheduled')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      homeTeam: data.home_team,
      awayTeam: data.away_team,
      date: String(data.date).slice(0, 10),
      time: data.time,
      weekday: data.weekday,
      isHome: data.is_home,
      ticketsUrl: data.tickets_url,
      espnEventId: data.espn_event_id ?? null,
    }
  }

  async updateMatchSchedule(id: string, date: string, time: string, weekday: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('matches')
      .update({ date, time, weekday })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }

  async fetchScheduled(): Promise<Array<{ id: string; home_team: string; away_team: string; date: string; time: string; weekday: string; is_home: boolean; venue: string | null; espn_event_id: string | null }>> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabaseAdmin
      .from('matches')
      .select('id, home_team, away_team, date, time, weekday, is_home, venue, espn_event_id')
      .eq('status', 'scheduled')
      .gte('date', today)
      .order('date', { ascending: true })
    // `date` may come back as a plain date or a full timestamptz depending on
    // the column type (prod vs dev drift) — normalize to YYYY-MM-DD, same as
    // getNextMatch() above.
    return (data ?? []).map((row) => ({ ...row, date: String(row.date).slice(0, 10) })) as Array<{
      id: string; home_team: string; away_team: string; date: string; time: string
      weekday: string; is_home: boolean; venue: string | null; espn_event_id: string | null
    }>
  }

  // Scheduled matches whose kickoff has already passed — candidates to close
  // out with the real result from ESPN (see fetchEspnMatchResult).
  async fetchUnfinishedPast(): Promise<Array<{ espnEventId: string; homeTeam: string; awayTeam: string }>> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabaseAdmin
      .from('matches')
      .select('home_team, away_team, date, espn_event_id')
      .eq('status', 'scheduled')
      .lt('date', today)
      .not('espn_event_id', 'is', null)
    return (data ?? []).map((m) => ({
      espnEventId: m.espn_event_id as string,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
    }))
  }

  async markMatchFinished(
    espnEventId: string,
    homeScore: number,
    awayScore: number,
    result: 'W' | 'L' | 'D'
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('matches')
      .update({ status: 'finished', home_score: homeScore, away_score: awayScore, result })
      .eq('espn_event_id', espnEventId)
    if (error) throw new Error(`Failed to mark match finished: ${error.message}`)
  }

  async fetchRecentForm(limit = 5): Promise<string[]> {
    const { data } = await supabase
      .from('matches')
      .select('result, date')
      .eq('status', 'finished')
      .not('result', 'is', null)
      .order('date', { ascending: false })
      .limit(limit)
    return (data ?? []).map((m) => m.result as string).reverse()
  }
}
