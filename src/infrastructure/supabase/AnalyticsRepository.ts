import { supabaseAdmin } from './adminClient'

export interface AnalyticsData {
  pushSubscribers: number
  mvpVotes: number
  predictions: number
  totalNews: number
  growth: { month: string; subs: number }[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
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

  let growth: { month: string; subs: number }[] = growthRaw ?? []

  if (!growthRaw) {
    const { data } = await supabaseAdmin
      .from('cron_logs')
      .select('created_at, details')
      .not('details->subscribers', 'is', null)
      .order('created_at', { ascending: true })

    if (data) {
      const byMonth: Record<string, number> = {}
      for (const row of data) {
        const month = (row.created_at as string).slice(0, 7)
        const value = Number((row.details as Record<string, string>)?.subscribers ?? 0)
        if (!byMonth[month] || value > byMonth[month]) byMonth[month] = value
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
