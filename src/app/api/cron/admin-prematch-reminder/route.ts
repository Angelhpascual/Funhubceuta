import { NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { logCron } from '@/infrastructure/supabase/logCron'
import { madridDateString } from '@/lib/madridTime'

const repo = new MatchesSupabaseRepository()

async function sendPrematchReminder() {
  const t0 = Date.now()
  try {
    const next = await repo.getNextMatch()
    if (!next) {
      await logCron('admin-prematch-reminder', 'success', Date.now() - t0, { skipped: 'no-upcoming-match' })
      return { skipped: 'no-upcoming-match' as const }
    }

    const tomorrow = madridDateString(new Date(Date.now() + 24 * 60 * 60 * 1000))
    if (next.date !== tomorrow) {
      const result = { skipped: 'not-tomorrow' as const }
      await logCron('admin-prematch-reminder', 'success', Date.now() - t0, result)
      return result
    }

    const rival = next.isHome ? next.awayTeam : next.homeTeam
    await notifyAdmin('⏰ Partido mañana', `vs ${rival} a las ${next.time}. El live se activará solo ~15 min antes.`)

    const result = { sent: true as const, rival, time: next.time }
    await logCron('admin-prematch-reminder', 'success', Date.now() - t0, result)
    return result
  } catch (err) {
    await logCron('admin-prematch-reminder', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  if (!(await verifyCronRequest(request))) return cronUnauthorized()
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  const result = await sendPrematchReminder()
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const result = await sendPrematchReminder()
  return NextResponse.json({ ok: true, ...result })
}
