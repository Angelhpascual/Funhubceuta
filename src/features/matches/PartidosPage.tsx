"use client";

import { useState } from "react";

const RESULTS = [
  { day: "26", mon: "Abr", home: "AD Ceuta", away: "Algeciras", hs: 2, as: 1, res: "W" },
  { day: "19", mon: "Abr", home: "Linares", away: "AD Ceuta", hs: 1, as: 1, res: "D" },
  { day: "12", mon: "Abr", home: "AD Ceuta", away: "Sevilla At.", hs: 3, as: 0, res: "W" },
  { day: "05", mon: "Abr", home: "Córdoba", away: "AD Ceuta", hs: 2, as: 0, res: "L" },
  { day: "29", mon: "Mar", home: "AD Ceuta", away: "San Fernando", hs: 1, as: 0, res: "W" },
];

const FIXTURES = [
  { jornada: "J33", date: "3 May · 18:00", home: "AD Ceuta", away: "Recreativo" },
  { jornada: "J34", date: "10 May · 12:00", home: "Antequera", away: "AD Ceuta" },
  { jornada: "J35", date: "17 May · 18:30", home: "AD Ceuta", away: "Almería B" },
];

export function PartidosPage() {
  const [tab, setTab] = useState("resultados");

  return (
    <div className="page">
      <div className="sec-header" style={{ paddingTop: 20 }}>
        <div>
          <div className="sec-title-small">Calendario 2025–26</div>
          <div className="sec-title">Partidos</div>
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {[{ id: "resultados", l: "Resultados" }, { id: "proximos", l: "Próximos" }].map((t) => (
          <button key={t.id} className={`chip ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "resultados" ? (
        <>
          <div className="month-label">Abril 2026</div>
          {RESULTS.map((r, i) => {
            const ceutaHome = r.home === "AD Ceuta";
            const cls = r.res === "W" ? "win" : r.res === "L" ? "lose" : "draw";
            const homeScoreCls = r.home === "AD Ceuta" ? (r.res === "W" ? "win" : r.res === "L" ? "lose" : "") : (r.res === "L" ? "win" : r.res === "W" ? "lose" : "");
            const awayScoreCls = r.away === "AD Ceuta" ? (r.res === "W" && !ceutaHome ? "win" : r.res === "L" && !ceutaHome ? "lose" : "") : (r.res === "L" && ceutaHome ? "lose" : r.res === "W" && ceutaHome ? "win" : "");
            return (
              <div key={i} className={`result-card ${cls}`}>
                <div className="result-date-col">
                  <div className="result-day">{r.day}</div>
                  <div className="result-mon">{r.mon}</div>
                </div>
                <div className="result-teams-col">
                  <div className="result-team-row">
                    <div className={`result-team-name ${r.home === "AD Ceuta" ? "bold" : ""}`}>{r.home}</div>
                    <div className={`result-score ${homeScoreCls}`}>{r.hs}</div>
                  </div>
                  <div className="result-team-row">
                    <div className={`result-team-name ${r.away === "AD Ceuta" ? "bold" : ""}`}>{r.away}</div>
                    <div className={`result-score ${awayScoreCls}`}>{r.as}</div>
                  </div>
                </div>
                <span className={`result-badge badge-${r.res.toLowerCase()}`}>
                  {r.res === "W" ? "V" : r.res === "D" ? "E" : "D"}
                </span>
              </div>
            );
          })}
        </>
      ) : (
        <>
          <div className="month-label">Mayo 2026</div>
          {FIXTURES.map((f, i) => (
            <div key={i} className="fixt-card">
              <div className="fixt-head">
                <div className="fixt-comp">Liga Hypermotion · {f.jornada}</div>
                <div className="fixt-date">{f.date}</div>
              </div>
              <div className="fixt-teams">
                <div className={`fixt-tname ${f.home === "AD Ceuta" ? "mine" : ""}`}>{f.home}</div>
                <div className="fixt-vs">VS</div>
                <div className={`fixt-tname away ${f.away === "AD Ceuta" ? "mine" : ""}`}>{f.away}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
