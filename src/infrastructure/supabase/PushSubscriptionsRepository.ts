import { supabase } from './client'

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export async function getAllSubscriptions(): Promise<PushSubscription[]> {
  const { data } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
  return data ?? []
}

export async function upsertSubscription(sub: PushSubscription & { user_agent?: string | null }): Promise<void> {
  await supabase
    .from('push_subscriptions')
    .upsert(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, user_agent: sub.user_agent },
      { onConflict: 'endpoint' }
    )
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
