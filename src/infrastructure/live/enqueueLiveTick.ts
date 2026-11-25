import { Client } from '@upstash/qstash'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { getAppEnv } from '@/lib/appEnv'
import { liveUrl } from './liveUrl'

export const LIVE_LAST_TICK_KEY = 'live_last_tick'
export const LIVE_CHAIN_KEY = 'live_chain_id'

/**
 * Queues the next /api/cron/live run as a one-off QStash *message* instead of
 * relying on a per-minute QStash *schedule*. Messages do not count against the
 * plan's maxSchedules quota — the quota that made live mode impossible to
 * activate for the Ceuta–Almería match (every attempt failed with
 * "quota maxSchedules exceeded, current limit: 10").
 *
 * Every message carries a chain id. Continuing a chain passes its id along;
 * starting one (activation, watchdog restart) omits it and a fresh id is stored,
 * which makes any tick still in flight from an older chain drop itself.
 *
 * Preview/local: no QStash, so this is a no-op (live there is driven by hand).
 */
export async function enqueueLiveTick(delaySeconds = 60, chainId?: string): Promise<{ enqueued: boolean }> {
  if (getAppEnv() !== 'production') return { enqueued: false }
  const client = new Client({ token: process.env.QSTASH_TOKEN! })
  const chain = chainId ?? crypto.randomUUID()
  if (!chainId) await setConfig(LIVE_CHAIN_KEY, chain)
  // Stamp BEFORE publishing: if the stamp failed after a successful publish the
  // watchdog would see an old tick and start a duplicate chain.
  await setConfig(LIVE_LAST_TICK_KEY, new Date().toISOString())
  await client.publishJSON({ url: liveUrl(), body: { chain }, delay: delaySeconds })
  return { enqueued: true }
}
