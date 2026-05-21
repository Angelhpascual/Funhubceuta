'use client'

import { useEffect, useState } from 'react'
import { NewsItem } from '@/domain/news/News'
import { SocialLinks } from '@/components/social/TwitterTimeline'
import { ScrapedMatch } from '@/infrastructure/scrapers/adceutaScraper'

const SOURCES: Record<string, { label: string; domain: string }> = {
  oficial:  { label: 'AD Ceuta FC',        domain: 'adceutafc.com' },
  elpueblo: { label: 'El Pueblo de Ceuta', domain: 'elpueblodeceuta.es' },
  faro:     { label: 'El Faro de Ceuta',   domain: 'elfarodeceuta.es' },
  marca:    { label: 'Marca',              domain: 'marca.com' },
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

const THUMB_COLORS = ['red', 'black', '', 'red', 'black', '']

import { findLogo } from '@/lib/findLogo'
import { proxyImage } from '@/lib/proxyImage'

function TeamCrest({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <div className="team-crest with-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
      </div>
    )
  }
  return <div className="team-crest">{name.slice(0, 3).toUpperCase()}</div>
}

export function HomePage({ onReady, onOpenHimno }: { onReady?: () => void; onOpenHimno?: () => void }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [nextMatch, setNextMatch] = useState<ScrapedMatch | null>(null)
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [venues, setVenues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/news?limit=6')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.news) setNews(data.news) })
      .catch(() => {})
      .finally(() => { setLoading(false); onReady?.() })

    fetch('/api/matches/next')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.match) setNextMatch(data.match) })
      .catch(() => {})

    fetch('/api/teams')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.teams) {
          const logos: Record<string, string> = {}
          const venueMap: Record<string, string> = {}
          for (const t of data.teams) {
            if (t.logoUrl) logos[t.name] = t.logoUrl
            if (t.venue) venueMap[t.name] = t.venue
          }
          setTeams(logos)
          setVenues(venueMap)
        }
      })
      .catch(() => {})
  }, [])

  const featured = news[0]
  const rest = news.slice(1)

  return (
    <div className="page">

      {/* ── HERO ── */}
      {featured ? (
        <a href={featured.url} target="_blank" rel="noopener noreferrer" className="hero-card" style={{ display: 'block' }}>
          {featured.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proxyImage(featured.imageUrl)!} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          ) : (
            <div className="hero-img-placeholder">FOTO PARTIDO</div>
          )}
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-tag" style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?domain=${SOURCES[featured.source]?.domain}&sz=16`} alt="" width={14} height={14} style={{ borderRadius: 2 }} />
              {SOURCES[featured.source]?.label ?? featured.source}
            </div>
            <div className="hero-headline">{featured.title}</div>
            <div className="hero-meta">{timeAgo(featured.publishedAt)}</div>
          </div>
        </a>
      ) : (
        <div className="hero-card">
          <div className="hero-img-placeholder">{loading ? 'CARGANDO…' : 'AD CEUTA'}</div>
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-tag">Destacado</div>
            <div className="hero-headline">Bienvenido al FanHub del AD Ceuta</div>
            <div className="hero-meta">Noticias próximamente</div>
          </div>
        </div>
      )}

      {/* ── PRÓXIMO PARTIDO ── */}
      {nextMatch && (
        <>
          <div className="sec-header">
            <div>
              <div className="sec-title-small">Próximo encuentro</div>
              <div className="sec-title">Próximo partido</div>
            </div>
          </div>
          <div className="match-card">
            <div className="match-competition">Liga Hypermotion</div>
            <div className="match-teams">
              <div className="team-block">
                <TeamCrest name={nextMatch.homeTeam} logo={findLogo(teams, nextMatch.homeTeam)} />
                <div className="team-name">{nextMatch.homeTeam}</div>
              </div>
              <div className="match-center">
                <div className="match-vs">VS</div>
                <div className="match-date-time">
                  {nextMatch.weekday.slice(0, 3).toUpperCase()}<br />{nextMatch.time}
                </div>
              </div>
              <div className="team-block">
                <TeamCrest name={nextMatch.awayTeam} logo={findLogo(teams, nextMatch.awayTeam)} />
                <div className="team-name">{nextMatch.awayTeam}</div>
              </div>
            </div>

            <div className="match-foot">
              <span>
                {new Date(nextMatch.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {' · '}
                {(() => {
                  const homeTeam = nextMatch.homeTeam
                  const venue = Object.entries(venues).find(([name]) =>
                    findLogo({ [name]: name }, homeTeam) !== null
                  )?.[1]
                  return venue ?? (nextMatch.isHome ? 'A. Murube' : homeTeam)
                })()}
              </span>
              {nextMatch.ticketsUrl ? (
                <a href={nextMatch.ticketsUrl} target="_blank" rel="noopener noreferrer" className="match-cta">
                  Entradas
                </a>
              ) : (
                <a href="https://adceutafc.com" target="_blank" rel="noopener noreferrer" className="match-cta">
                  Info
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NOTICIAS ── */}
      <div className="sec-header">
        <div>
          <div className="sec-title-small">Actualidad</div>
          <div className="sec-title">Últimas noticias</div>
        </div>
        {rest.length > 0 && <div className="sec-link">Ver todo</div>}
      </div>

      {loading && (
        <div style={{ padding: '20px 16px', fontFamily: 'var(--font-display)', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11 }}>
          Cargando noticias…
        </div>
      )}

      {rest.map((n, i) => (
        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="news-item" style={{ textDecoration: 'none' }}>
          {n.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div className={`news-thumb`} style={{ backgroundImage: `url(${proxyImage(n.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ) : (
            <div className={`news-thumb ${THUMB_COLORS[i % THUMB_COLORS.length]}`} />
          )}
          <div className="news-body">
            <div className="news-tag" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?domain=${SOURCES[n.source]?.domain}&sz=16`} alt="" width={12} height={12} style={{ borderRadius: 2 }} />
              {SOURCES[n.source]?.label ?? n.source}
            </div>
            <div className="news-title">{n.title}</div>
            <div className="news-meta">{timeAgo(n.publishedAt)}</div>
          </div>
        </a>
      ))}

      {!loading && news.length === 0 && (
        <div style={{ padding: '16px', fontFamily: 'var(--font-display)', color: 'var(--muted)', fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          No hay noticias aún — ejecuta el sync para cargarlas
        </div>
      )}

      {/* ── HIMNO ── */}
      <div style={{ padding: '8px 12px 0' }}>
        <button
          onClick={onOpenHimno}
          style={{ textDecoration: 'none', display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px',
            background: 'var(--black)',
            borderRadius: 'var(--radius)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* diagonal stripes */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)',
              pointerEvents: 'none',
            }} />
            {/* red accent */}
            <div style={{ width: 4, height: 42, background: 'var(--red)', borderRadius: 2, flexShrink: 0 }} />
            {/* icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Himno del AD Ceuta
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                Ver letra completa
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--red)' }}>→</div>
          </div>
        </button>
      </div>

      {/* ── TWITTER ── */}
      <div className="sec-header">
        <div>
          <div className="sec-title-small">#adceuta</div>
          <div className="sec-title">En redes</div>
        </div>
      </div>
      <SocialLinks />

      <div style={{ height: 8 }} />
    </div>
  )
}
