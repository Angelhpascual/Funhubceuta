import { NextResponse } from 'next/server'
import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

export const revalidate = 300

export const GET = withApi(async () => {
  const ranking = await getMvpSeasonRanking()
  return NextResponse.json({ ranking })
})
