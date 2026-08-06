'use client'

import { useEffect, useRef, useState } from 'react'
import { NewsItem } from '@/domain/news/News'
import { proxyImage } from '@/lib/proxyImage'

export function useHomeNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsFetched, setNewsFetched] = useState(false)
  const [featuredImageReady, setFeaturedImageReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [minTimePassed, setMinTimePassed] = useState(false)

  const mountedAtRef = useRef(0)
  const imagePerfEnabledRef = useRef(false)
  const newsFetchStartedAtRef = useRef(0)
  const newsRequestedRef = useRef(false)

  // Minimum time so TrueFocus animation gets at least 3 full cycles
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 3600)
    return () => clearTimeout(t)
  }, [])

  // Safety timeout — never stay on loading screen more than 8s
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    mountedAtRef.current = performance.now()
    const params = new URLSearchParams(window.location.search)
    const enabled =
      params.get('perfImages') === '1' || window.localStorage.getItem('perfImages') === '1'
    imagePerfEnabledRef.current = enabled
    if (enabled) console.info('[home image perf] tracking enabled')
  }, [])

  useEffect(() => {
    if (newsRequestedRef.current) return
    newsRequestedRef.current = true
    newsFetchStartedAtRef.current = performance.now()

    fetch('/api/news?limit=10')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.news) {
          if (imagePerfEnabledRef.current) {
            console.table([{
              step: 'news fetched',
              msFromMount: Math.round(performance.now() - mountedAtRef.current),
              durationMs: Math.round(performance.now() - newsFetchStartedAtRef.current),
              items: data.news.length,
              featuredHasImage: Boolean(data.news[0]?.imageUrl),
            }])
          }
          setNews(data.news)
        }
      })
      .catch(() => {})
      .finally(() => setNewsFetched(true))
  }, [])

  const featuredImage = proxyImage(news[0]?.imageUrl)
  const loading =
    !timedOut && (!minTimePassed || !newsFetched || (!!featuredImage && !featuredImageReady))

  function reportFeaturedImageLoad(img: HTMLImageElement) {
    if (!imagePerfEnabledRef.current) return
    const currentSrc = img.currentSrc
    const resource = performance
      .getEntriesByType('resource')
      .filter((e): e is PerformanceResourceTiming => e instanceof PerformanceResourceTiming)
      .find((e) => e.name === currentSrc)

    console.table([{
      step: 'featured image loaded',
      msFromMount: Math.round(performance.now() - mountedAtRef.current),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      transferKb: resource ? Math.round(resource.transferSize / 102.4) / 10 : 'n/a',
      encodedKb: resource ? Math.round(resource.encodedBodySize / 102.4) / 10 : 'n/a',
      requestMs: resource ? Math.round(resource.responseEnd - resource.startTime) : 'n/a',
      url: currentSrc,
    }])
  }

  return {
    news,
    loading,
    featuredImage,
    setFeaturedImageReady,
    reportFeaturedImageLoad,
  }
}
