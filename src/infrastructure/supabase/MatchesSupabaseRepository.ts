import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import type { ScrapedMatch, ScrapedResult } from '@/infrastructure/scrapers/adceutaScraper'
import { CURRENT_MATCH_SEASON, COMPETITION } from '@/lib/constants'
import { deduplicateMatches } from '@/lib/deduplicateMatches'
import { madridDateString } from '@/lib/madridTime'

export class MatchesSupabaseRepository {
  async upsertResults(results: ScrapedResult[]): Promise<void> {
    if (results.length === 0) return
    const { error } = await supabaseAdmin.from('matches').upsert(
      results.map((r) => ({
        // Same external_id scheme as upsertMatches() — a result for a match that
        // was already inserted as 'scheduled' must upsert onto that same row
        // instead of inserting a second one. The two used different formats
        // ('result-' prefix here) until this fix, producing a stuck duplicate
        // pair (one 'scheduled', one 'finished') every time a match's result
        // synced after its schedule entry (e.g. Burgos-Ceuta, FC Andorra-Ceuta).
        external_id: `${r.date}-${r.homeTeam}-${r.awayTeam}`.toLowerCase().replace(/\s+/g, '-'),
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

    const externalIdFor = (m: { date: string; homeTeam: string; awayTeam: string }) =>
      `${m.date}-${m.homeTeam}-${m.awayTeam}`.toLowerCase().replace(/\s+/g, '-')

    // Used to decide whether this scrape looks complete enough to prune
    // stale fixtures below, and (if not) to leave existing rows alone.
    const { data: existingScheduled } = await supabaseAdmin
      .from('matches')
      .select('id, external_id')
      .eq('status', 'scheduled')
    const existingCount = existingScheduled?.length ?? 0

    // Upsert (not delete-then-insert): a partial scrape — ESPN hiccup,
    // only 3 of the usual ~10 upcoming fixtures returned — must never wipe
    // out fixtures a previous, complete scrape already stored. Upserting
    // what we have is always safe; only the pruning step below is gated.
    const { error } = await supabaseAdmin.from('matches').upsert(
      matches.map((m) => ({
        external_id: externalIdFor(m),
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
      })),
      { onConflict: 'external_id' }
    )
    if (error) throw new Error(`Failed to upsert matches: ${error.message}`)

    // Prune fixtures that are no longer upcoming (rescheduled/removed by the
    // league) — but only when this scrape returned at least half of what was
    // already there, so a partial/broken scrape can't delete the rest.
    const looksComplete = existingCount === 0 || matches.length >= existingCount / 2
    if (looksComplete) {
      const scrapedIds = new Set(matches.map(externalIdFor))
      const staleIds = (existingScheduled ?? [])
        .filter((row) => !scrapedIds.has(row.external_id))
        .map((row) => row.id)
      if (staleIds.length > 0) {
        await supabaseAdmin.from('matches').delete().in('id', staleIds)
      }
    }
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

  async fetchByEspnId(espnId: string): Promise<{ date: string; time: string } | null> {
    const { data } = await supabase
      .from('matches')
      .select('date, time')
      .eq('espn_event_id', espnId)
      .maybeSingle()
    return data ?? null
  }

  async getNextMatch(): Promise<ScrapedMatch | null> {
    // Madrid calendar day, not UTC: the `date` column is a Madrid date, and
    // between 00:00 and 02:00 Madrid in summer UTC is still the previous day.
    const today = madridDateString(new Date())

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
      // lte, not lt: a match played *today* can already be finished by the
      // time this cron runs later the same day (e.g. an evening kickoff
      // closed out by a 23:00 run) — excluding today's date meant it sat
      // unclosed until the next scheduled run, which for this cron can be
      // a week later (confirmed with Ceuta-Oviedo, 2026-10-18: ESPN had the
      // final score by 23:00 same day, but the cron skipped it and it
      // stayed 'scheduled' for a week). closeFinishedMatchesFromEspn only
      // acts when ESPN reports state 'post', so including today is safe —
      // a same-day match still mid-play is simply skipped, same as before.
      .lte('date', today)
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
