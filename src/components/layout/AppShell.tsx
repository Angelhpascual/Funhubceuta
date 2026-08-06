'use client'

import { usePathname } from 'next/navigation'
import { InstallModal } from '@/components/ui/InstallModal'
import { MvpBanner } from '@/components/ui/MvpBanner'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { isSSRRoute } from '@/components/layout/nav.config'
import { useHtmlLoader } from '@/hooks/useHtmlLoader'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useHtmlLoader(pathname)

  if (pathname.startsWith('/admin')) return <>{children}</>

  // Home page: Topbar overlay on desktop; page.tsx handles its own mobile topbar
  if (!isSSRRoute(pathname)) {
    return (
      <>
        <InstallModal />
        <div className="desktop-topbar-overlay">
          <Topbar />
        </div>
        {children}
      </>
    )
  }

  return (
    <div id="app-root">
      <InstallModal />
      <Topbar />
      <div className="scroll-area">{children}</div>
      <MvpBanner />
      <BottomNav />
    </div>
  )
}
