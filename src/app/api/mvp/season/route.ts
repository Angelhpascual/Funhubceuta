import { NextResponse } from 'next/server'
import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'

export const revalidate = 300

export async function GET() {
  const ranking = await getMvpSeasonRanking()
  return NextResponse.json({ ranking })
}
