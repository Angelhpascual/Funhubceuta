import { getConfig, setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'

/**
 * Stops live mode: deletes any legacy QStash per-minute schedule (best effort)
 * and clears the live flags. The self-chaining tick stops by itself once
 * live_active is false. Shared by the normal "match finished" path and the
 * max-duration safety guard so both leave the system in the same state.
 */
export async function stopLiveSchedule(): Promise<void> {
  const scheduleId = await getConfig('live_qstash_schedule_id')
  if (scheduleId) {
    try {
      const { Client } = await import('@upstash/qstash')
      const client = new Client({ token: process.env.QSTASH_TOKEN! })
      await client.schedules.delete(scheduleId)
    } catch { /* best effort */ }
    await deleteConfig('live_qstash_schedule_id')
  }
  await setConfig('live_active', 'false')
  await deleteConfig('live_activated_at')
  await deleteConfig('live_last_tick')
  await deleteConfig('live_chain_id')
  await deleteConfig('live_error_streak')
}
