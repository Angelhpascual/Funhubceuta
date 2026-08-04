import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { MSG } from '@/app/api/cron/live/messages'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const body = await request.json() as {
    event: 'kickoff' | 'goal_ceuta' | 'goal_rival' | 'red_ceuta' | 'red_rival' | 'win' | 'loss' | 'draw'
    rival?: string
    scorer?: string
    score?: string
    minute?: string
  }

  const rival   = body.rival   ?? 'Rival FC'
  const scorer  = body.scorer  ?? 'Jugador'
  const score   = body.score   ?? '0-0'
  const minute  = body.minute  ?? "90'"

  let msg: { title: string; body: string }
  switch (body.event) {
    case 'kickoff':    msg = MSG.kickoff(rival); break
    case 'goal_ceuta': msg = MSG.goalCeuta(scorer, score, minute); break
    case 'goal_rival': msg = MSG.goalRival(scorer, score); break
    case 'red_ceuta':  msg = MSG.redCeuta(scorer, minute); break
    case 'red_rival':  msg = MSG.redRival(scorer, minute); break
    case 'win':        msg = MSG.winCeuta(score); break
    case 'loss':       msg = MSG.lossCeuta(score); break
    case 'draw':       msg = MSG.drawCeuta(score); break
    default: return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_CONTACT ?? 'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const env = process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
  const subs = await getAllSubscriptions({ adminOnly: true, environment: env })
  if (!subs.length) {
    return NextResponse.json({ ok: true, sent: 0, warn: 'No admin subscribers — mark your device as admin first' })
  }

  const payload = JSON.stringify({ title: msg.title, body: msg.body, tag: `sim-${body.event}`, url: '/live' })
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const status = (err as Record<string, unknown>)?.statusCode
        if (status === 410 || status === 404) await deleteSubscription(sub.endpoint)
      }
    })
  )

  return NextResponse.json({ ok: true, sent, event: body.event, msg })
}
