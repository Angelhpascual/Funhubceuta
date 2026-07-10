import { NextResponse } from 'next/server'
import { getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'

export async function GET() {
  const ranking = await getPredictionSeasonRanking()
  return NextResponse.json({ ranking }, { headers: { 'Cache-Control': 'no-store' } })
}
