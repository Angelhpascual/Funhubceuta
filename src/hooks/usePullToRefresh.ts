'use client'

import { useState, useRef, useCallback } from 'react'

export const PULL_THRESHOLD = 64
export const PULL_MAX = 80

// Rubber-band resistance: feels natural like native iOS
function rubberBand(dy: number): number {
  return Math.min(PULL_MAX, Math.sqrt(dy) * 5.5)
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const refreshingRef = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = document.querySelector('.scroll-area')
    if ((scrollEl?.scrollTop ?? 0) === 0) {
      touchStartY.current = e.touches[0].clientY
      pulling.current = true
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshingRef.current) return
    const scrollEl = document.querySelector('.scroll-area')
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0 && (scrollEl?.scrollTop ?? 0) === 0) {
      setPullY(rubberBand(dy))
    } else {
      pulling.current = false
      setPullY(0)
    }
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (pullY >= PULL_THRESHOLD && !refreshingRef.current) {
      pulling.current = false
      refreshingRef.current = true
      setRefreshing(true)
      setPullY(PULL_THRESHOLD) // snap to threshold while refreshing
      await onRefresh()
      setRefreshing(false)
      refreshingRef.current = false
      setPullY(0)
    } else {
      pulling.current = false
      setPullY(0)
    }
  }, [pullY, onRefresh])

  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd }
}
