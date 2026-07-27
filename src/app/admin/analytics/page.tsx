import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { AnalyticsDashboard } from '@/features/admin/AnalyticsDashboard'

async function getAnalyticsData() {
  const [
    { count: pushSubscribers },
    { count: mvpVotes },
    { count: predictions },
    { count: totalNews },
  ] = await Promise.all([
    supabaseAdmin.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('mvp_votes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('prediction_votes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('news').select('*', { count: 'exact', head: true }),
  ])

  return {
    pushSubscribers: pushSubscribers ?? 0,
    mvpVotes: mvpVotes ?? 0,
    predictions: predictions ?? 0,
    totalNews: totalNews ?? 0,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsDashboard data={data} />
}
