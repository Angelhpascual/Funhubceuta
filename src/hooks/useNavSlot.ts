'use client'

import { useState, useEffect } from 'react'

export type NavSlotState = {
  liveActive: boolean
  slotHref: '/live' | '/merchan' | '/mercado'
  slotLabel: 'Live' | 'Tienda' | 'Mercado'
  slotMode: 'live' | 'tienda' | 'mercado'
}

const CACHE_KEY = 'nav_slot_state'
const CACHE_TTL = 60_000 // 1 minuto

type CachedState = { liveActive: boolean; tiendaActive: boolean }

let memCache: { value: CachedState; ts: number } | null = null

function isPreseason(): boolean {
  const month = new Date().getMonth() + 1
  return month === 7 || month === 8
}

function readCache(): CachedState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return value as CachedState
  } catch {
    return null
  }
}

function writeCache(value: CachedState) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }))
  } catch { /* ignore */ }
}

const DEFAULT_STATE: CachedState = { liveActive: false, tiendaActive: false }

export function useNavSlot(): NavSlotState {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<CachedState>(DEFAULT_STATE)

  useEffect(() => {
    const cached = readCache() ?? (memCache && Date.now() - memCache.ts < CACHE_TTL ? memCache.value : null)
    if (cached !== null) {
      memCache = { value: cached, ts: Date.now() }
      setState(cached)
      setMounted(true)
      return
    }

    Promise.all([
      fetch('/api/admin/live-control').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/admin/merchan-toggle').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([liveData, merchanData]) => {
      const fresh: CachedState = {
        liveActive: liveData?.active === true,
        tiendaActive: merchanData?.mercadoActive === false,
      }
      memCache = { value: fresh, ts: Date.now() }
      writeCache(fresh)
      setState(fresh)
      setMounted(true)
    })
  }, [])

  // Antes de hidratar devolvemos siempre mercado para que SSR y cliente coincidan
  const { liveActive, tiendaActive } = mounted ? state : DEFAULT_STATE

  const slotMode: 'live' | 'tienda' | 'mercado' = liveActive
    ? 'live'
    : tiendaActive
      ? 'tienda'
      : 'mercado'

  return {
    liveActive,
    slotHref: slotMode === 'live' ? '/live' : slotMode === 'tienda' ? '/merchan' : '/mercado',
    slotLabel: slotMode === 'live' ? 'Live' : slotMode === 'tienda' ? 'Tienda' : 'Mercado',
    slotMode,
  }
}

/** Llamar desde admin al cambiar toggle o live para invalidar la caché inmediatamente */
export function invalidateNavSlotCache() {
  memCache = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
