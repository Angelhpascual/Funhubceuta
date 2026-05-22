export const maxDuration = 60

import { NextResponse } from 'next/server'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'

const service = new StandingsService(new StandingsSupabaseRepository())
const teamsRepo = new TeamsSupabaseRepository()

export async function POST() {
  const standings = await service.syncFromApi('2025-2026')

  if (!standings) {
    return NextResponse.json({ error: 'Failed to sync standings' }, { status: 500 })
  }

  // Persist team logos extracted from standings
  await teamsRepo.upsertTeams(
    standings.entries.map(e => ({
      name: e.teamName,
      logoUrl: e.teamLogo,
      season: '2025-2026',
    }))
  )

  return NextResponse.json({ success: true, teams: standings.entries.length })
}
