import { NextRequest, NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'

const repo = new MatchesSupabaseRepository()

const WEEKDAYS: Record<number, string> = { 0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SAB' }

export async function PATCH(req: NextRequest) {
  const { id, date, time } = await req.json()
  if (!id || !date) return NextResponse.json({ error: 'id and date required' }, { status: 400 })

  const d = new Date(date + 'T12:00:00Z')
  const weekday = WEEKDAYS[d.getUTCDay()] ?? 'DOM'

  await repo.updateMatchSchedule(id, date, time ?? '', weekday)
  return NextResponse.json({ ok: true })
}
