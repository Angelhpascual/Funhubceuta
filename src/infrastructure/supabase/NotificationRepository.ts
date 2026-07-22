import { supabase } from './client'
import { supabaseAdmin } from './adminClient'

export async function getRecentNotifTitles(sinceIso: string): Promise<string[]> {
  const { data } = await supabase
    .from('notification_logs')
    .select('article_title')
    .gte('created_at', sinceIso)
  return (data ?? []).map((n) => n.article_title as string)
}

/** Titles of articles currently pending review in the notify queue */
export async function getQueuedTitles(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('news')
    .select('title')
    .eq('notify_queued', true)
    .eq('discarded', false)
  return (data ?? []).map((n) => n.title as string)
}

/** Titles of articles the admin has explicitly discarded in the last 30 days — used to prevent re-queuing */
export async function getDiscardedTitles(): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('news')
    .select('title')
    .eq('discarded', true)
    .gte('created_at', since)
  return (data ?? []).map((n) => n.title as string)
}

export async function markDiscarded(externalId: string): Promise<void> {
  await supabaseAdmin
    .from('news')
    .update({ discarded: true, published: false, notify_queued: false })
    .eq('external_id', externalId)
}

export async function markNotifyQueued(externalId: string): Promise<void> {
  await supabaseAdmin.from('news').update({ notify_queued: true }).eq('external_id', externalId)
}

export async function getSubscriberCount(): Promise<number> {
  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}
