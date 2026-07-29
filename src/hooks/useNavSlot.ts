'use client'

import { useState, useEffect } from 'react'

export type NavSlotState = {
  liveActive: boolean
  slotHref: '/live' | '/merchan' | '/mercado'
  slotLabel: 'Live' | 'Tienda' | 'Mercado'
  slotMode: 'live' | 'tienda' | 'mercado'
}

const CACHE_KEY = 'nav_live_active'
const CACHE_TTL = 60_000 // 1 minuto

function isPreseason(): boolean {
  const month = new Date().getMonth() + 1
  return month === 7 || month === 8
}

function readCache(): boolean | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return value as boolean
  } catch {
    return null
  }
}

function writeCache(value: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }))
  } catch { /* ignore */ }
}

// Singleton en memoria para compartir entre instancias del hook en la misma página
let memCache: { value: boolean; ts: number } | null = null

export function useNavSlot(): NavSlotState {
  const [liveActive, setLiveActive] = useState<boolean>(() => {
    // Inicializar desde caché en memoria (instantáneo, sin flicker)
    if (memCache && Date.now() - memCache.ts < CACHE_TTL) return memCache.value
    return false
  })

  useEffect(() => {
    // Intentar sessionStorage antes del fetch
    const cached = readCache()
    if (cached !== null) {
      memCache = { value: cached, ts: Date.now() }
      setLiveActive(cached)
      return
    }

    fetch('/api/admin/live-control')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const active = d?.active === true
        memCache = { value: active, ts: Date.now() }
        writeCache(active)
        setLiveActive(active)
      })
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

/** Llamar desde la página /live al activar/desactivar para invalidar la caché */
export function invalidateNavSlotCache() {
  memCache = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
