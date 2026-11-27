import { NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { alertCronProblem } from '@/infrastructure/cron/runCron'
import { logCron } from '@/infrastructure/supabase/logCron'

const repo = new MatchesSupabaseRepository()

async function sendWeeklyDigest() {
  const t0 = Date.now()
  try {
    const next = await repo.getNextMatch()
    if (!next) {
      // Without an upcoming match the live mode never auto-activates and nothing
      // else notices: tell the admin so the fixtures can be refreshed.
      await alertCronProblem('admin-weekly-digest', 'empty', 'No hay próximo partido en la base de datos; el directo no se activará solo.')
      await logCron('admin-weekly-digest', 'success', Date.now() - t0, { skipped: 'no-upcoming-match' })
      return { skipped: 'no-upcoming-match' as const }
    }

    const rival = next.isHome ? next.awayTeam : next.homeTeam
    const body = `vs ${rival} el ${next.weekday} ${next.date} a las ${next.time}. Revisa mercado/noticias si toca.`
    await notifyAdmin('📅 Esta semana', body)

    const result = { sent: true as const, rival, date: next.date, time: next.time }
    await logCron('admin-weekly-digest', 'success', Date.now() - t0, result)
    return result
  } catch (err) {
    await logCron('admin-weekly-digest', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  if (!(await verifyCronRequest(request))) return cronUnauthorized()
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  const result = await sendWeeklyDigest()
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const result = await sendWeeklyDigest()
  return NextResponse.json({ ok: true, ...result })
}
