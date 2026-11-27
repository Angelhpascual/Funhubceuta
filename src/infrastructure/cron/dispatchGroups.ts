// Recurring jobs that used to hold one QStash *schedule* each. The plan allows
// only 10 schedules (the limit that silently stopped squad/tweets and broke live
// mode), but one-off *messages* don't count against it. So two schedules (daily
// and weekly) hit /api/cron/dispatch, which publishes one message per job.
// Each job keeps its own route, signature check, retries and maxDuration.
export interface DispatchJob {
  path: string
  // Seconds after the dispatch tick: staggers scrapers and preserves the old
  // relative timing (e.g. the pre-match reminder ran an hour after match-day).
  delay: number
}

export const DISPATCH_GROUPS: Record<'daily' | 'weekly', DispatchJob[]> = {
  daily: [
    { path: '/api/cron/match-day', delay: 0 },
    { path: '/api/cron/admin-prematch-reminder', delay: 3600 },
  ],
  weekly: [
    { path: '/api/cron/player-stats', delay: 0 },
    { path: '/api/cron/matches', delay: 120 },
    { path: '/api/cron/squad', delay: 240 },
    { path: '/api/standings/sync', delay: 360 },
    { path: '/api/cron/admin-weekly-digest', delay: 3600 },
  ],
}

export type DispatchGroup = keyof typeof DISPATCH_GROUPS

export function isDispatchGroup(v: string | null): v is DispatchGroup {
  return v === 'daily' || v === 'weekly'
}
