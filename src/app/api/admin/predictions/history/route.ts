import { NextResponse } from 'next/server'
import { getPredictionHistory, getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const [history, seasonRanking] = await Promise.all([
    getPredictionHistory(),
    getPredictionSeasonRanking(),
  ])
  return NextResponse.json({ history, seasonRanking })
})
