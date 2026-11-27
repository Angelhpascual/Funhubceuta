import { Client } from '@upstash/qstash'

// The cron routes expected to run on a recurring QStash schedule. Kept as a
// manual list (not derived from the filesystem) because not every route
// under src/app/api/cron is meant to be scheduled — some only ever run via
// the admin "sync now" button (see trigger/route.ts's callDirect actions).
export const EXPECTED_CRON_PATHS = [
  '/api/cron/news',
  '/api/cron/tweets',
  '/api/cron/close-finished-matches',
  '/api/cron/backfill-images',
  '/api/cron/auto-activate-live',
  // Fan-out ticks: one daily and one weekly schedule publish QStash messages
  // for match-day, admin-prematch-reminder (daily) and player-stats, matches,
  // squad, standings/sync, admin-weekly-digest (weekly). See dispatchGroups.ts.
  // Both ticks share a route, so the group query is part of the expected path.
  '/api/cron/dispatch?group=daily',
  '/api/cron/dispatch?group=weekly',
  // live is driven by self-chaining messages (enqueueLiveTick), not a
  // schedule. backfill-squad-photos runs inside squad; backfill-transfer-photos
  // only from the admin button.
]

export interface ScheduleHealthEntry {
  path: string
  scheduleId: string
  cron: string
  isPaused: boolean
  lastScheduleTime: number | null
  nextScheduleTime: number | null
}

export interface ScheduleHealth {
  scheduled: ScheduleHealthEntry[]
  missing: string[]
  unexpected: ScheduleHealthEntry[]
}

function pathFromDestination(destination: string): string {
  try {
    const u = new URL(destination)
    return u.pathname + u.search
  } catch {
    return destination
  }
}

export async function getScheduleHealth(): Promise<ScheduleHealth> {
  const client = new Client({ token: process.env.QSTASH_TOKEN! })
  const schedules = await client.schedules.list()

  const entries: ScheduleHealthEntry[] = schedules.map((s) => ({
    path: pathFromDestination(s.destination),
    scheduleId: s.scheduleId,
    cron: s.cron,
    isPaused: s.isPaused,
    lastScheduleTime: s.lastScheduleTime ?? null,
    nextScheduleTime: s.nextScheduleTime ?? null,
  }))

  const scheduledPaths = new Set(entries.map((e) => e.path))
  const missing = EXPECTED_CRON_PATHS.filter((p) => !scheduledPaths.has(p))
  const unexpected = entries.filter((e) => !EXPECTED_CRON_PATHS.includes(e.path))

  return { scheduled: entries, missing, unexpected }
}
