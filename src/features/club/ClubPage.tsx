"use client";

import { useState } from "react";

const PLAYERS_TOP = [
  { num: 9, name: "Moussa Diallo", pos: "Delantero", stat: 14, label: "Goles" },
  { num: 7, name: "Jacobo González", pos: "Extremo", stat: 9, label: "Goles" },
  { num: 10, name: "Álex Bernal", pos: "Mediapunta", stat: 11, label: "Asist." },
  { num: 5, name: "Raúl Cámara", pos: "Defensa", stat: 3, label: "Goles" },
  { num: 1, name: "Juan Portilla", pos: "Portero", stat: 10, label: "Paradas" },
];

const SQUAD = [
  { pos: "Porteros", players: [{ num: 1, name: "Juan Portilla", nat: "ESP" }, { num: 13, name: "Adrián Robles", nat: "ESP" }] },
  { pos: "Defensas", players: [{ num: 2, name: "Álvaro Jiménez", nat: "ESP" }, { num: 3, name: "Ismael Sossa", nat: "GNB" }, { num: 4, name: "Raúl Cámara", nat: "ESP" }, { num: 16, name: "Carlos Bravo", nat: "ESP" }] },
  { pos: "Centrocampistas", players: [{ num: 6, name: "Jorge Herrero", nat: "ESP" }, { num: 8, name: "Álex Bernal", nat: "ESP" }, { num: 14, name: "Mamadou Sylla", nat: "SEN" }] },
  { pos: "Delanteros", players: [{ num: 7, name: "Jacobo González", nat: "ESP" }, { num: 9, name: "Moussa Diallo", nat: "MLI" }, { num: 11, name: "Darío Gil", nat: "ESP" }] },
];

export function ClubPage() {
  const [tab, setTab] = useState("plantilla");

  return (
    <div className="page">
      <div className="sec-header" style={{ paddingTop: 20 }}>
        <div>
          <div className="sec-title-small">Temporada 2025–26</div>
          <div className="sec-title">AD Ceuta</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 12 }}>
        <div className="stat-tile red">
          <div className="stat-value">54</div>
          <div className="stat-label">Puntos</div>
        </div>
        <div className="stat-tile dark">
          <div className="stat-value">4º</div>
          <div className="stat-label">Clasificación</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">48</div>
          <div className="stat-label">Goles a favor</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">16</div>
          <div className="stat-label">Victorias</div>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 4 }}>
        {[{ id: "plantilla", l: "Plantilla" }, { id: "goleadores", l: "Máx. Goleadores" }].map((t) => (
          <button key={t.id} className={`chip ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "plantilla"
        ? SQUAD.map((g) => (
            <div key={g.pos}>
              <div className="position-label">{g.pos}</div>
              {g.players.map((p, i) => (
                <div key={i} className="player-row">
                  <div className="player-num">{p.num}</div>
                  <div className="player-avatar">{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                  <div className="player-info">
                    <div className="player-name">{p.name}</div>
                    <div className="player-pos">{p.nat}</div>
                  </div>
                </div>
              ))}
            </div>
          ))
        : PLAYERS_TOP.map((p, i) => (
            <div key={i} className="player-row">
              <div className="player-num">{i + 1}</div>
              <div className="player-avatar">{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
              <div className="player-info">
                <div className="player-name">{p.name}</div>
                <div className="player-pos">{p.pos}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="player-stat">{p.stat}</div>
                <div className="player-stat-label">{p.label}</div>
              </div>
            </div>
          ))}
      <div style={{ height: 8 }} />
    </div>
  );
}
