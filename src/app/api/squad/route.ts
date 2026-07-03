import { NextResponse } from 'next/server'
import { fetchSquadBySeason } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'

export async function GET() {
  try {
    const { grouped, total } = await fetchSquadBySeason(CURRENT_SEASON)
    return NextResponse.json({ grouped, total })
  } catch (err) {
    return apiError(err)
  }
}
