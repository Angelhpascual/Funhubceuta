import { getAdminStats } from '@/infrastructure/supabase/AdminStatsRepository'
import { AdminDashboard } from '@/features/admin/AdminDashboard'

export default async function AdminPage() {
  const stats = await getAdminStats()
  return <AdminDashboard stats={stats} />
}
