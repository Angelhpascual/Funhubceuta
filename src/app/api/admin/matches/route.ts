import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

const WEEKDAYS: Record<number, string> = { 0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SAB' }

export const PATCH = withApi(async (req: NextRequest) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const { id, date, time } = await req.json()
  if (!id || !date) return NextResponse.json({ error: 'id and date required' }, { status: 400 })

  const d = new Date(date + 'T12:00:00Z')
  const weekday = WEEKDAYS[d.getUTCDay()] ?? 'DOM'

  await repo.updateMatchSchedule(id, date, time ?? '', weekday)

  revalidatePath('/')
  revalidatePath('/partidos')

  return NextResponse.json({ ok: true })
})
