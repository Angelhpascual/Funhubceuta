import { NextResponse } from 'next/server'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'

const service = new StandingsService(new StandingsSupabaseRepository())

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') ?? '2025-2026'

  const standings = await service.getStandings(season)

  if (!standings) {
    return NextResponse.json({ error: 'No standings found' }, { status: 404 })
  }

  return NextResponse.json(standings)
}
