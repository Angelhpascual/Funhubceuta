"use client";

import { useState, useEffect } from "react";

interface Player {
  id: string
  dorsal: number | null
  name: string
  position: string
  position_group: string
  nationality: string
}

interface Group {
  group: string
  players: Player[]
}

const NAT_FLAGS: Record<string, string> = {
  España: '🇪🇸', Mali: '🇲🇱', Senegal: '🇸🇳', Guinea: '🇬🇳', Bisau: '🇬🇼',
  Argentina: '🇦🇷', Uruguay: '🇺🇾', Colombia: '🇨🇴', Francia: '🇫🇷',
  Marruecos: '🇲🇦', Argelia: '🇩🇿', Camerún: '🇨🇲', Brasil: '🇧🇷',
}

function flag(nationality: string): string {
  for (const [key, emoji] of Object.entries(NAT_FLAGS)) {
    if (nationality.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🏴'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function ClubPage() {
  const [tab, setTab] = useState("plantilla");
  const [grouped, setGrouped] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/squad')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.grouped) setGrouped(d.grouped)
        if (d?.total) setTotal(d.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="sec-header" style={{ paddingTop: 20 }}>
        <div>
          <div className="sec-title-small">Temporada 2025–26</div>
          <div className="sec-title">AD Ceuta FC</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 12 }}>
        <div className="stat-tile red">
          <div className="stat-value">13º</div>
          <div className="stat-label">Clasificación</div>
        </div>
        <div className="stat-tile dark">
          <div className="stat-value">55</div>
          <div className="stat-label">Puntos</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Jugadores</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">40</div>
          <div className="stat-label">Jornadas</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 4 }}>
        <button className={`chip ${tab === "plantilla" ? "active" : ""}`} onClick={() => setTab("plantilla")}>
          Plantilla
        </button>
      </div>

      {/* Squad */}
      {loading ? (
        <div style={{ padding: '30px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Cargando plantilla…
        </div>
      ) : (
        grouped.map(g => (
          <div key={g.group}>
            <div className="position-label">{g.group}</div>
            {g.players.map((p, i) => (
              <div key={i} className="player-row">
                <div className="player-num">{p.dorsal ?? '—'}</div>
                <div className="player-avatar">{initials(p.name)}</div>
                <div className="player-info">
                  <div className="player-name">{p.name}</div>
                  <div className="player-pos">{capitalize(p.position)}</div>
                </div>
                <div style={{ fontSize: 18 }} title={p.nationality}>
                  {flag(p.nationality)}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
      <div style={{ height: 8 }} />
    </div>
  );
}
