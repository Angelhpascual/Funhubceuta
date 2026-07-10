import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getAllSubscriptions } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { MSG } from '@/app/api/cron/live/messages'

// Simulate live match events to test push notifications.
// Only sends to admin subscribers — never reaches regular users.
// Protected by TEST_SECRET.

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    event: 'kickoff' | 'goal_ceuta' | 'goal_rival' | 'red_ceuta' | 'red_rival' | 'win' | 'loss' | 'draw'
    rival?: string
    scorer?: string
    score?: string
    minute?: string
  }

  const rival = body.rival ?? 'Real Madrid'
  const scorer = body.scorer ?? 'Zalazar'
  const score = body.score ?? '1-0'
  const minute = body.minute ?? "67'"

  let msg: { title: string; body: string }
  switch (body.event) {
    case 'kickoff':  msg = MSG.kickoff(rival); break
    case 'goal_ceuta': msg = MSG.goalCeuta(scorer, score, minute); break
    case 'goal_rival': msg = MSG.goalRival(scorer, score); break
    case 'red_ceuta':  msg = MSG.redCeuta(scorer, minute); break
    case 'red_rival':  msg = MSG.redRival(scorer, minute); break
    case 'win':   msg = MSG.winCeuta(score); break
    case 'loss':  msg = MSG.lossCeuta(score); break
    case 'draw':  msg = MSG.drawCeuta(score); break
    default: return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const subs = await getAllSubscriptions({ adminOnly: true })
  if (!subs.length) {
    return NextResponse.json({ ok: true, sent: 0, warn: 'No admin subscribers found — mark your device as admin from the panel first' })
  }

  const payload = JSON.stringify({ title: msg.title, body: msg.body, tag: `simulate-${body.event}`, url: '/partidos' })
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
