import { NextResponse } from 'next/server'
import { getPredictionHistory } from '@/infrastructure/supabase/PredictionRepository'

export async function GET() {
  const history = await getPredictionHistory()
  return NextResponse.json({ history })
}
