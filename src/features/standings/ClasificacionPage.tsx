"use client";

import { useState, useEffect } from "react";
import { StandingEntry } from "@/domain/standings/Standings";

function getZone(entry: StandingEntry): string {
  const desc = entry.description?.toLowerCase() ?? "";
  if (desc.includes("promotion") && !desc.includes("playoff")) return "promo";
  if (desc.includes("playoff")) return "playoff";
  if (desc.includes("relegat")) return "relegation";
  return "none";
}

function isCeuta(entry: StandingEntry): boolean {
  return entry.teamName.toLowerCase().includes("ceuta");
}

export function ClasificacionPage() {
  const [entries, setEntries] = useState<StandingEntry[]>([]);
  const [filter, setFilter] = useState("general");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.entries) setEntries(data.entries);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const me = entries.find(isCeuta);

  return (
    <div className="page">
      <div className="clas-hero">
        <div className="clas-hero-eyebrow">Temporada 2025–26</div>
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
              <div className="clas-mine-name">AD Ceuta</div>
              <div className="clas-mine-sub">
                {getZone(me) === "promo" ? "Ascenso directo" : getZone(me) === "playoff" ? "Zona play-off" : "Zona media"}
              </div>
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
            <div className="clas-mini-stat"><div className="clas-mini-num">{me.goalsFor}:{me.goalsAgainst}</div><div className="clas-mini-lbl">Goles</div></div>
          </div>
          {me.form && (
            <div className="clas-mine-form">
              <span className="clas-mine-form-lbl">Últimos 5</span>
              {me.form.split("").slice(-5).map((f, i) => (
                <div key={i} className={`form-pill ${f}`}>{f}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sec-header">
        <div className="sec-title">Tabla completa</div>
      </div>
      <div className="chips">
        {[
          { id: "general", l: "General" },
          { id: "casa", l: "En casa" },
          { id: "fuera", l: "Fuera" },
          { id: "forma", l: "Forma reciente" },
        ].map((c) => (
          <button key={c.id} className={`chip ${filter === c.id ? "active" : ""}`} onClick={() => setFilter(c.id)}>
            {c.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "40px 16px", textAlign: "center", fontFamily: "var(--font-display)", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Cargando clasificación…
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
            const zone = getZone(t);
            const mine = isCeuta(t);
            return (
              <div key={t.id ?? t.externalId} className={`clas-row zone-${zone} ${mine ? "mine" : ""}`}>
                <div className="clas-pos">{t.position}</div>
                <div className="clas-name-block">
                  <div className="clas-crest">{t.teamName.slice(0, 3).toUpperCase()}</div>
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
        <div className="legend-item"><div className="legend-bar black" /><div className="legend-text">Descenso</div></div>
      </div>
    </div>
  );
}
