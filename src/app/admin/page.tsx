import { getAdminStats } from '@/infrastructure/supabase/AdminStatsRepository'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { getAppEnv } from '@/lib/appEnv'

export default async function AdminPage() {
  const stats = await getAdminStats()
  return <AdminDashboard stats={stats} isProduction={getAppEnv() === 'production'} />
}
