import { PartidosPage } from '@/features/matches/PartidosPage'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { deduplicateMatches } from '@/app/api/matches/deduplicateMatches'

export const revalidate = 300 // 5 min

async function fetchMatches() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(60)

  const deduped = deduplicateMatches(data ?? [])
  const today = new Date().toISOString().split('T')[0]

  const upcoming = deduped
    .filter(r => r.status === 'scheduled' && String(r.date).slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const results = deduped
    .filter(r => r.status === 'finished' || (r.status === 'scheduled' && String(r.date).slice(0, 10) < today))
    .sort((a, b) => b.date.localeCompare(a.date))

  return { upcoming, results }
}

async function fetchLogos(): Promise<Record<string, string>> {
  const repo = new TeamsSupabaseRepository()
  const teams = await repo.getAllTeams()
  const map: Record<string, string> = {}
  for (const t of teams) if (t.logoUrl) map[t.name] = t.logoUrl
  return map
}

export default async function PartidosServerPage() {
  const [{ upcoming, results }, logos] = await Promise.all([
    fetchMatches(),
    fetchLogos(),
  ])

  return (
    <PartidosPage
      initialUpcoming={upcoming}
      initialResults={results}
      initialLogos={logos}
    />
  )
}
