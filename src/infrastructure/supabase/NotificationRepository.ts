import { supabase } from './client'

export async function getRecentNotifTitles(sinceIso: string): Promise<string[]> {
  const { data } = await supabase
    .from('notification_logs')
    .select('article_title')
    .gte('created_at', sinceIso)
  return (data ?? []).map((n) => n.article_title as string)
}

export async function markNotifyQueued(externalId: string): Promise<void> {
  await supabase.from('news').update({ notify_queued: true }).eq('external_id', externalId)
}

export async function getSubscriberCount(): Promise<number> {
  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
  return count ?? 0
}
