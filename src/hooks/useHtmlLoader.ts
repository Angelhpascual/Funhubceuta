'use client'

import { useEffect } from 'react'
import { isSSRRoute } from '@/components/layout/nav.config'

function removeHtmlLoader() {
  const el = document.getElementById('html-loader')
  if (!el) return
  el.style.opacity = '0'
  el.style.pointerEvents = 'none'
  el.style.transition = 'opacity 0.3s ease'
}

export function useHtmlLoader(pathname: string) {
  useEffect(() => {
    if (isSSRRoute(pathname) || pathname.startsWith('/admin')) removeHtmlLoader()
  }, [pathname])
}
