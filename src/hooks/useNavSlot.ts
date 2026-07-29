'use client'

import { useState, useEffect } from 'react'

export type NavSlotState = {
  liveActive: boolean
  slotHref: '/live' | '/merchan' | '/mercado'
  slotLabel: 'Live' | 'Tienda' | 'Mercado'
  slotMode: 'live' | 'tienda' | 'mercado'
}

type CachedState = { liveActive: boolean; tiendaActive: boolean }

const CACHE_KEY = 'nav_slot_state'
const CACHE_TTL = 60_000

let memCache: { value: CachedState; ts: number } | null = null

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

function resolve(s: CachedState): NavSlotState {
  const slotMode: 'live' | 'tienda' | 'mercado' = s.liveActive ? 'live' : s.tiendaActive ? 'tienda' : 'mercado'
  return {
    liveActive: s.liveActive,
    slotHref: slotMode === 'live' ? '/live' : slotMode === 'tienda' ? '/merchan' : '/mercado',
    slotLabel: slotMode === 'live' ? 'Live' : slotMode === 'tienda' ? 'Tienda' : 'Mercado',
    slotMode,
  }
}

const DEFAULT = resolve({ liveActive: false, tiendaActive: false })

export function useNavSlot(): NavSlotState {
  const [navState, setNavState] = useState<NavSlotState>(DEFAULT)

  useEffect(() => {
    // 1. Caché en memoria (instantáneo)
    if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
      setNavState(resolve(memCache.value))
      return
    }
    // 2. sessionStorage
    const cached = readCache()
    if (cached) {
      memCache = { value: cached, ts: Date.now() }
      setNavState(resolve(cached))
      return
    }
    // 3. Fetch
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
      setNavState(resolve(fresh))
    })
  }, [])

  return navState
}

export function invalidateNavSlotCache() {
  memCache = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
