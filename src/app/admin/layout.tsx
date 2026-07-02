import type { Metadata, Viewport } from 'next'
import { AdminShell } from '@/features/admin/AdminShell'

export const metadata: Metadata = {
  title: 'AD Ceuta Admin',
  manifest: '/admin-manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
