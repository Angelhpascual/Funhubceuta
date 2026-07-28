import { NextResponse } from 'next/server'
import { getPredictionHistory, getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function GET() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const [history, seasonRanking] = await Promise.all([
    getPredictionHistory(),
    getPredictionSeasonRanking(),
  ])
  return NextResponse.json({ history, seasonRanking })
}
