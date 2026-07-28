import { NextResponse } from 'next/server'
import { closePredictionSession } from '@/infrastructure/supabase/PredictionRepository'
import { apiError } from '@/lib/apiError'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  try {
    const { sessionId, homeResult, awayResult } = await request.json()
    if (!sessionId || homeResult == null || awayResult == null) {
      return NextResponse.json({ error: 'sessionId, homeResult y awayResult requeridos' }, { status: 400 })
    }
    const { error } = await closePredictionSession(sessionId, homeResult, awayResult)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
