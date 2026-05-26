"use client";

import { useState, useEffect } from "react";
import { StandingEntry } from "@/domain/standings/Standings";
import { findLogo as findLogoUtil } from "@/lib/findLogo";

function getZone(pos: number, total: number): string {
  if (pos <= 2) return "promo";
  if (pos <= 6) return "playoff";
  if (pos >= total - 3) return "relegation";
  return "none";
}

function getZoneLabel(pos: number, total: number): string {
  if (pos <= 2) return "Ascenso directo";
  if (pos <= 6) return "Zona play-off";
  if (pos >= total - 3) return "Zona descenso";
  return "Zona media";
}

function isCeuta(entry: StandingEntry): boolean {
  return entry.teamName.toLowerCase().includes("ceuta");
}

function FormPill({ result }: { result: string }) {
  return (
    <div className={`form-pill ${result}`}>{result}</div>
  );
}

export function ClasificacionPage() {
  const [entries, setEntries] = useState<StandingEntry[]>([]);
const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<string[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.entries) setEntries(data.entries) })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch Ceuta recent form from matches results
    fetch("/api/matches/results")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.form) setForm(data.form) })
      .catch(() => {});

    // Fetch team logos
    fetch("/api/teams")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.teams) {
          const map: Record<string, string> = {};
          for (const t of data.teams) if (t.logoUrl) map[t.name] = t.logoUrl;
          setLogos(map);
        }
      })
      .catch(() => {});
  }, []);

  const me = entries.find(isCeuta);
  const total = entries.length;

  function findLogo(name: string): string | null {
    return findLogoUtil(logos, name);
  }

  return (
    <div className="page">
      <div className="clas-hero">
        <div className="clas-hero-eyebrow">Temporada 2025–26 · Jornada {me?.played ?? "—"}</div>
        <div className="clas-hero-title">
          CLASIFI<em>CACIÓN</em>
          <br />
          LIGA HYPERMOTION
        </div>
      </div>

      {me && (
        <div className="clas-mine-card">
          <div className="clas-mine-top">
            <div className="clas-pos-big">
              {me.position}
              <span className="clas-pos-sup">º</span>
            </div>
            <div className="clas-mine-meta">
              <div className="clas-mine-name">AD Ceuta FC</div>
              <div className="clas-mine-sub">{getZoneLabel(me.position, total)}</div>
            </div>
            <div className="clas-mine-pts-block">
              <div className="clas-mine-pts-num">{me.points}</div>
              <div className="clas-mine-pts-lbl">Puntos</div>
            </div>
          </div>
          <div className="clas-mine-stats">
            <div className="clas-mini-stat"><div className="clas-mini-num">{me.played}</div><div className="clas-mini-lbl">PJ</div></div>
            <div className="clas-mini-stat"><div className="clas-mini-num">{me.won}</div><div className="clas-mini-lbl">PG</div></div>
            <div className="clas-mini-stat"><div className="clas-mini-num">{me.drawn}</div><div className="clas-mini-lbl">PE</div></div>
            <div className="clas-mini-stat"><div className="clas-mini-num">{me.lost}</div><div className="clas-mini-lbl">PP</div></div>
            <div className="clas-mini-stat">
              <div className="clas-mini-num">{me.goalDifference > 0 ? `+${me.goalDifference}` : me.goalDifference}</div>
              <div className="clas-mini-lbl">DG</div>
            </div>
          </div>
          {form.length > 0 && (
            <div className="clas-mine-form">
              <span className="clas-mine-form-lbl">Últimos 5</span>
              {form.slice(-5).map((f, i) => <FormPill key={i} result={f} />)}
            </div>
          )}
        </div>
      )}

      <div className="sec-header">
        <div className="sec-title">Tabla completa</div>
      </div>

      {loading ? (
        <div className="clas-table">
          <div className="clas-table-head">
            <div className="clas-th">#</div>
            <div className="clas-th name">Equipo</div>
            <div className="clas-th">PJ</div>
            <div className="clas-th">DG</div>
            <div className="clas-th">GF</div>
            <div className="clas-th">GC</div>
            <div className="clas-th pts">PTS</div>
          </div>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="clas-row" style={{ opacity: 1 - i * 0.03 }}>
              <div className="clas-pos">
                <div style={{ width: 16, height: 14, background: 'var(--bg-mid)', borderRadius: 3, animation: 'shimmer 1.4s ease-in-out infinite' }} />
              </div>
              <div className="clas-name-block">
                <div style={{ width: 22, height: 22, background: 'var(--bg-mid)', borderRadius: '50%', flexShrink: 0, animation: 'shimmer 1.4s ease-in-out infinite' }} />
                <div style={{ width: 90 + (i % 3) * 20, height: 13, background: 'var(--bg-mid)', borderRadius: 3, animation: 'shimmer 1.4s ease-in-out infinite' }} />
              </div>
              {[1,2,3,4,5].map(j => (
                <div key={j} className="clas-cell">
                  <div style={{ width: 20, height: 13, background: 'var(--bg-mid)', borderRadius: 3, margin: '0 auto', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          ))}
          <style>{`@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
        </div>
      ) : (
        <div className="clas-table">
          <div className="clas-table-head">
            <div className="clas-th">#</div>
            <div className="clas-th name">Equipo</div>
            <div className="clas-th">PJ</div>
            <div className="clas-th">DG</div>
            <div className="clas-th">GF</div>
            <div className="clas-th">GC</div>
            <div className="clas-th pts">PTS</div>
          </div>
          {entries.map((t) => {
            const zone = getZone(t.position, total);
            const mine = isCeuta(t);
            const logo = findLogo(t.teamName);
            return (
              <div key={t.id ?? t.externalId} className={`clas-row zone-${zone} ${mine ? "mine" : ""}`}>
                <div className="clas-pos">{t.position}</div>
                <div className="clas-name-block">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt={t.teamName} style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} />
                  ) : (
                    <div className="clas-crest">{t.teamName.slice(0, 3).toUpperCase()}</div>
                  )}
                  <div className="clas-name">{t.teamName}</div>
                </div>
                <div className="clas-cell">{t.played}</div>
                <div className="clas-cell">{t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</div>
                <div className="clas-cell">{t.goalsFor}</div>
                <div className="clas-cell">{t.goalsAgainst}</div>
                <div className="clas-cell pts">{t.points}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="clas-legend">
        <div className="clas-legend-title">Zonas de la tabla</div>
        <div className="legend-item"><div className="legend-bar gold" /><div className="legend-text">Ascenso directo · 1.º–2.º</div></div>
        <div className="legend-item"><div className="legend-bar red" /><div className="legend-text">Play-off ascenso · 3.º–6.º</div></div>
        <div className="legend-item"><div className="legend-bar black" /><div className="legend-text">Descenso · 19.º–22.º</div></div>
      </div>
    </div>
  );
}
