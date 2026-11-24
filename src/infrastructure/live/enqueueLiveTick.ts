import { Client } from '@upstash/qstash'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { getAppEnv } from '@/lib/appEnv'
import { liveUrl } from './liveUrl'

export const LIVE_LAST_TICK_KEY = 'live_last_tick'

/**
 * Queues the next /api/cron/live run as a one-off QStash *message* instead of
 * relying on a per-minute QStash *schedule*. Messages do not count against the
 * plan's maxSchedules quota — the quota that made live mode impossible to
 * activate for the Ceuta–Almería match (every attempt failed with
 * "quota maxSchedules exceeded, current limit: 10").
 *
 * Preview/local: no QStash, so this is a no-op (live there is driven by hand).
 */
export async function enqueueLiveTick(delaySeconds = 60): Promise<{ enqueued: boolean }> {
  if (getAppEnv() !== 'production') return { enqueued: false }
  const client = new Client({ token: process.env.QSTASH_TOKEN! })
  await client.publishJSON({ url: liveUrl(), body: {}, delay: delaySeconds })
  await setConfig(LIVE_LAST_TICK_KEY, new Date().toISOString())
  return { enqueued: true }
}
