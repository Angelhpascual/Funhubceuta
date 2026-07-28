import { NextResponse } from 'next/server'
import { getPredictionHistory } from '@/infrastructure/supabase/PredictionRepository'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function GET() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const history = await getPredictionHistory()
  return NextResponse.json({ history })
}
