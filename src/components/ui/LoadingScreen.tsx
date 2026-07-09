'use client'

import { useEffect, useRef } from 'react'

const WORDS = ['ORGULLO', 'CABALLA']

export function LoadingScreen({ fadeOut, onFadeOutDone }: { fadeOut?: boolean; onFadeOutDone?: () => void }) {
  const boxRef = useRef<HTMLSpanElement>(null)

  // Hide the HTML pre-loader once our React loader is ready (don't remove — React owns the node)
  useEffect(() => {
    const el = document.getElementById('html-loader')
    if (!el) return
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
  }, [])
  const word0 = useRef<HTMLSpanElement>(null)
  const word1 = useRef<HTMLSpanElement>(null)
  const words = [word0, word1]

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    let idx = 0

    function moveTo(i: number) {
      const el = words[i].current
      if (!el || !box) return
      const rect = el.getBoundingClientRect()
      const parentRect = el.offsetParent?.getBoundingClientRect() ?? rect
      box.style.width = rect.width + 8 + 'px'
      box.style.height = rect.height + 4 + 'px'
      box.style.left = rect.left - parentRect.left - 4 + 'px'
      box.style.top = rect.top - parentRect.top - 2 + 'px'
      words.forEach((w, j) => {
        if (w.current) w.current.style.filter = j === i ? 'blur(0)' : 'blur(3px)'
      })
    }

    moveTo(0)
    const interval = setInterval(() => {
      idx = (idx + 1) % WORDS.length
      moveTo(idx)
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!fadeOut) return
    const t = setTimeout(() => onFadeOutDone?.(), 600)
    return () => clearTimeout(t)
  }, [fadeOut])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        zIndex: 999,
        transition: 'opacity 0.5s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Escudo + spinner */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}
        >
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-mid)" strokeWidth="4" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--red)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="326"
            strokeDashoffset="245"
            style={{ transformOrigin: '60px 60px', animation: 'arc 1.4s ease-in-out infinite' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.webp" alt="AD Ceuta" style={{ width: 68, height: 68, objectFit: 'contain' }} />
        </div>
      </div>

      {/* TrueFocus words */}
      <div style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'center' }}>
        <span
          ref={boxRef}
          style={{
            position: 'absolute',
            border: '2px solid var(--red)',
            borderRadius: 6,
            boxShadow: '0 0 8px var(--red)',
            transition: 'all 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
            pointerEvents: 'none',
          }}
        />
        {WORDS.map((word, i) => (
          <span
            key={word}
            ref={words[i]}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: 'var(--black)',
              transition: 'filter 0.45s ease',
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(270deg); }
        }
        @keyframes arc {
          0%   { stroke-dashoffset: 310; }
          50%  { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 310; }
        }
      `}</style>
    </div>
  )
}
