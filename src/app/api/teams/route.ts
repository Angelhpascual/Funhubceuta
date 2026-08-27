import { NextResponse } from 'next/server'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { withApi } from '@/lib/apiError'

const repo = new TeamsSupabaseRepository()

export const GET = withApi(async () => {
  const teams = await repo.getAllTeams()
  // Rivals for the current season are fixed once the calendar is set — cache generously.
  return NextResponse.json(
    { teams },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
})
