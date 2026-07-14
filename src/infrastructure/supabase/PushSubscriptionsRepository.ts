import { supabase } from './client'
import { supabaseAdmin } from './adminClient'

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export async function getAllSubscriptions(options: { adminOnly?: boolean; environment?: string } = {}): Promise<PushSubscription[]> {
  let query = supabaseAdmin.from('push_subscriptions').select('endpoint, p256dh, auth')
    .eq('environment', options.environment ?? 'production')
  if (options.adminOnly) query = query.eq('is_admin', true)
  const { data } = await query
  return data ?? []
}

export async function upsertSubscription(
  sub: PushSubscription & { user_agent?: string | null; environment?: string }
): Promise<void> {
  await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        user_agent: sub.user_agent,
        environment: sub.environment ?? 'production',
      },
      { onConflict: 'endpoint' }
    )
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

export async function markSubscriptionAsAdmin(endpoint: string): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .update({ is_admin: true })
    .eq('endpoint', endpoint)
  return { error: error?.message ?? null }
}
