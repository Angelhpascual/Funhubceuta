import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { AnalyticsDashboard } from '@/features/admin/AnalyticsDashboard'

async function getAnalyticsData() {
  const [
    { count: pushSubscribers },
    { count: mvpVotes },
    { count: predictions },
    { count: totalNews },
    { data: growthRaw },
  ] = await Promise.all([
    supabaseAdmin.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('mvp_votes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('prediction_votes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('news').select('*', { count: 'exact', head: true }),
    supabaseAdmin.rpc('subscribers_by_month').then((r) => r, () => ({ data: null })),
  ])

  // Fallback: query cron_logs directly for monthly max subscribers
  let growth: { month: string; subs: number }[] = []
  if (!growthRaw) {
    const { data } = await supabaseAdmin
      .from('cron_logs')
      .select('created_at, details')
      .not('details->subscribers', 'is', null)
      .order('created_at', { ascending: true })
    if (data) {
      const byMonth: Record<string, number> = {}
      for (const row of data) {
        const m = (row.created_at as string).slice(0, 7)
        const v = Number((row.details as Record<string, string>)?.subscribers ?? 0)
        if (!byMonth[m] || v > byMonth[m]) byMonth[m] = v
      }
      growth = Object.entries(byMonth).map(([month, subs]) => ({ month, subs }))
    }
  }

  return {
    pushSubscribers: pushSubscribers ?? 0,
    mvpVotes: mvpVotes ?? 0,
    predictions: predictions ?? 0,
    totalNews: totalNews ?? 0,
    growth,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsDashboard data={data} />
}
