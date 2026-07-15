import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { PartidosClient } from './PartidosClient'

export default async function PartidosAdminPage() {
  const repo = new MatchesSupabaseRepository()
  const matches = await repo.fetchScheduled()
  return <PartidosClient matches={matches} />
}
