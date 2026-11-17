import { getAdminStats } from '@/infrastructure/supabase/AdminStatsRepository'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { APP_ENV } from '@/lib/appEnv'

export default async function AdminPage() {
  const stats = await getAdminStats()
  return <AdminDashboard stats={stats} isProduction={APP_ENV === 'production'} />
}
