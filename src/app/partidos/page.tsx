import { PartidosPage } from '@/features/matches/PartidosPage'
import { supabase } from '@/infrastructure/supabase/client'
import { deduplicateMatches } from '@/app/api/matches/deduplicateMatches'
import { fetchTeamLogos } from '@/lib/serverFetches'
import { CURRENT_SEASON } from '@/lib/constants'

export const revalidate = 300

async function fetchMatches() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .eq('season', CURRENT_SEASON)
    .order('date', { ascending: false })
    .limit(60)

  const deduped = deduplicateMatches(data ?? [])
  const today = new Date().toISOString().split('T')[0]

  const upcoming = deduped
    .filter((r) => r.status === 'scheduled' && String(r.date).slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const results = deduped
    .filter(
      (r) =>
        r.status === 'finished' || (r.status === 'scheduled' && String(r.date).slice(0, 10) < today)
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  return { upcoming, results }
}

export default async function PartidosServerPage() {
  const [{ upcoming, results }, logos] = await Promise.all([fetchMatches(), fetchTeamLogos()])

  return <PartidosPage upcoming={upcoming} results={results} logos={logos} />
}
