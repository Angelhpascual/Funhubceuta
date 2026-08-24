'use client'

import Image from 'next/image'
import type { MvpCandidate } from '@/infrastructure/supabase/MvpRepository'

const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M6 9V4h12v5a6 6 0 01-12 0zM4 6h2M18 6h2M9 20h6M12 15v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ——— FIFA card: usada para el MVP proclamado y para el líder en vivo ——— */
export function FifaCard({
  candidate,
  votePct,
  voteCount,
  eyebrow = 'MVP del partido',
}: {
  candidate: MvpCandidate
  votePct: number
  voteCount: number
  eyebrow?: string
}) {
  return (
    <div className="mvp-winner mb-5">
      <div className="wn-strp" />
      <div className="wn-trophy"><IconTrophy /></div>
      <div className="wn-eye">{eyebrow}</div>

      <div className="fifa-card fc-no-cursor">
        <div className="fc-rays" />
        <div className="fc-seam" />
        <div className="fc-shine" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.webp" alt="" width={28} height={33} className="fc-escudo" />
        <div className="fc-top">
          <div>
            <div className="fc-rating">{votePct}<span>% votos</span></div>
            <div className="fc-pos">{candidate.position}</div>
          </div>
        </div>
        <div className="fc-photo">
          {candidate.photo_url ? (
            <Image src={candidate.photo_url} alt={candidate.name} fill sizes="220px" className="object-cover object-top" />
          ) : (
            <div className="fc-photo-bust" />
          )}
        </div>
        <div className="fc-bottom">
          <div className="fc-name-bar">
            <div className="fc-name">{candidate.name}</div>
            <div className="fc-divider" />
          </div>
          <div className="fc-stats">
            <div className="fc-stat"><b>#{candidate.number}</b><span>Dorsal</span></div>
            <div className="fc-stat"><b>Votos: {voteCount}</b><span>{votePct}% del total</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
