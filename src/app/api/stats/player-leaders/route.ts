import { NextResponse } from 'next/server'
import { fetchLeadersBySeason } from '@/infrastructure/supabase/PlayerStatsRepository'
import { CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'

export async function GET() {
  try {
    const leaders = await fetchLeadersBySeason(CURRENT_SEASON)
    return NextResponse.json({ leaders }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
  } catch (err) {
    return apiError(err)
  }
}
