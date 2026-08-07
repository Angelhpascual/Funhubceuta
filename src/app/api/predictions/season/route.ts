import { NextResponse } from 'next/server'
import { getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  const ranking = await getPredictionSeasonRanking()
  return NextResponse.json({ ranking }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
})
