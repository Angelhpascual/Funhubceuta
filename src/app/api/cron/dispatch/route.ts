import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { DISPATCH_GROUPS, isDispatchGroup } from '@/infrastructure/cron/dispatchGroups'
import { alertCronProblem } from '@/infrastructure/cron/runCron'
import { logCron } from '@/infrastructure/supabase/logCron'
import { getAppEnv } from '@/lib/appEnv'

export const maxDuration = 30

// Fan-out: one schedule tick -> one QStash message per job in the group.
// Messages are not subject to the plan's maxSchedules quota.
export async function POST(request: Request) {
  if (!(await verifyCronRequest(request))) return cronUnauthorized()

  const group = new URL(request.url).searchParams.get('group')
  if (!isDispatchGroup(group)) {
    return NextResponse.json({ error: 'group must be daily or weekly' }, { status: 400 })
  }

  const t0 = Date.now()
  // Preview/local have no QStash: nothing to publish.
  if (getAppEnv() !== 'production') {
    return NextResponse.json({ ok: true, group, skipped: 'not-production' })
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app'
  const client = new Client({ token: process.env.QSTASH_TOKEN! })
  const jobs = DISPATCH_GROUPS[group]

  const settled = await Promise.allSettled(
    jobs.map((job) => client.publishJSON({ url: `${base}${job.path}`, body: {}, delay: job.delay }))
  )

  const failed = jobs.filter((_, i) => settled[i].status === 'rejected').map((j) => j.path)
  const dispatched = jobs.filter((_, i) => settled[i].status === 'fulfilled').map((j) => j.path)
  const details = { group, dispatched, failed }
  await logCron('dispatch', failed.length ? 'error' : 'success', Date.now() - t0, details)

  if (failed.length) {
    await alertCronProblem('dispatch', 'error', `No se pudieron encolar: ${failed.join(', ')}`)
    // 500 makes QStash retry the tick; re-publishing the jobs that did go out is
    // harmless (each is idempotent or a refresh) and beats silently dropping one.
    return NextResponse.json({ ok: false, ...details }, { status: 500 })
  }
  return NextResponse.json({ ok: true, ...details })
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 })
}
