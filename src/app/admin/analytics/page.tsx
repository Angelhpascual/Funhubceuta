import { getAnalyticsData } from '@/infrastructure/supabase/AnalyticsRepository'
import { AnalyticsDashboard } from '@/features/admin/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsDashboard data={data} />
}
