import { NextResponse } from 'next/server'
import { fetchLeadersBySeason } from '@/infrastructure/supabase/PlayerStatsRepository'
import { CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'

export async function GET() {
  try {
    const leaders = await fetchLeadersBySeason(CURRENT_SEASON)
    return NextResponse.json({ leaders })
  } catch (err) {
    return apiError(err)
  }
}
