import { supabase } from './client'
import { ScrapedMatch } from '@/infrastructure/scrapers/adceutaScraper'
import { CURRENT_SEASON, COMPETITION } from '@/lib/constants'
import { deduplicateMatches } from '@/lib/deduplicateMatches'

export class MatchesSupabaseRepository {
  async upsertMatches(matches: ScrapedMatch[]): Promise<void> {
    if (matches.length === 0) return

    // Delete existing scheduled matches and replace with fresh data
    await supabase.from('matches').delete().eq('status', 'scheduled')

    const { error } = await supabase.from('matches').insert(
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
        season: CURRENT_SEASON,
        competition: COMPETITION,
        espn_event_id: m.espnEventId,
      }))
    )

    if (error) throw new Error(`Failed to upsert matches: ${error.message}`)
  }

  async fetchBySeason(season: string, limit = 60) {
    const { data } = await supabase
      .from('matches')
      .select('*')
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

  async getNextMatch(): Promise<ScrapedMatch | null> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('matches')
      .select('*')
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
}
