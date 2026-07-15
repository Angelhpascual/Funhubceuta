import { NextResponse } from 'next/server'
import { getMvpHistory } from '@/infrastructure/supabase/MvpRepository'

export const revalidate = 0

export async function GET() {
  const history = await getMvpHistory(3)
  return NextResponse.json({ history })
}
