'use client'

import { useState, useEffect } from 'react'

export type NavSlotState = {
  liveActive: boolean
  mercadoActive: boolean
  /** Resolved href for the dynamic slot (/live, /merchan, or /mercado) */
  slotHref: '/live' | '/merchan' | '/mercado'
  /** Resolved label for the dynamic slot */
  slotLabel: 'Live' | 'Tienda' | 'Mercado'
  /** Which mode the slot is in */
  slotMode: 'live' | 'tienda' | 'mercado'
}

export function useNavSlot(): NavSlotState {
  const [liveActive, setLiveActive] = useState(false)
  const [mercadoActive, setMercadoActive] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/live-control?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.active) setLiveActive(true) })
      .catch(() => {})

    fetch('/api/admin/merchan-toggle')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d !== null) setMercadoActive(d.mercadoActive) })
      .catch(() => {})
  }, [])

  const slotMode = liveActive ? 'live' : !mercadoActive ? 'tienda' : 'mercado'

  return {
    liveActive,
    mercadoActive,
    slotHref: slotMode === 'live' ? '/live' : slotMode === 'tienda' ? '/merchan' : '/mercado',
    slotLabel: slotMode === 'live' ? 'Live' : slotMode === 'tienda' ? 'Tienda' : 'Mercado',
    slotMode,
  }
}
