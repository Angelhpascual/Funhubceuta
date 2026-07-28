'use client'

import { useState, useEffect } from 'react'

export type NavSlotState = {
  liveActive: boolean
  /** Resolved href for the dynamic slot (/live, /merchan, or /mercado) */
  slotHref: '/live' | '/merchan' | '/mercado'
  /** Resolved label for the dynamic slot */
  slotLabel: 'Live' | 'Tienda' | 'Mercado'
  /** Which mode the slot is in */
  slotMode: 'live' | 'tienda' | 'mercado'
}

function isPreseason(): boolean {
  const month = new Date().getMonth() + 1 // 1-12
  return month === 7 || month === 8 // julio y agosto
}

export function useNavSlot(): NavSlotState {
  const [liveActive, setLiveActive] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/live-control?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.active) setLiveActive(true) })
      .catch(() => {})
  }, [])

  const slotMode = liveActive ? 'live' : isPreseason() ? 'mercado' : 'tienda'

  return {
    liveActive,
    slotHref: slotMode === 'live' ? '/live' : slotMode === 'mercado' ? '/mercado' : '/merchan',
    slotLabel: slotMode === 'live' ? 'Live' : slotMode === 'mercado' ? 'Mercado' : 'Tienda',
    slotMode,
  }
}
