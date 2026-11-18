import { Client } from '@upstash/qstash'

// The cron routes expected to run on a recurring QStash schedule. Kept as a
// manual list (not derived from the filesystem) because not every route
// under src/app/api/cron is meant to be scheduled — some only ever run via
// the admin "sync now" button (see trigger/route.ts's callDirect actions).
export const EXPECTED_CRON_PATHS = [
  '/api/cron/news',
  '/api/cron/matches',
  '/api/cron/match-day',
  '/api/cron/tweets',
  '/api/cron/player-stats',
  '/api/cron/squad',
  '/api/cron/close-finished-matches',
  '/api/cron/backfill-images',
  '/api/cron/backfill-squad-photos',
  '/api/cron/backfill-transfer-photos',
  '/api/cron/admin-prematch-reminder',
  '/api/cron/admin-weekly-digest',
  '/api/cron/auto-activate-live',
  // live and stats are activated/deactivated dynamically (see
  // activateLive.ts) rather than running on a permanent schedule, so they're
  // intentionally excluded from this expected set.
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
    return new URL(destination).pathname
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
