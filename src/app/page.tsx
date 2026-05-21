"use client";

import { useState } from "react";
import { HomePage } from "@/features/home/HomePage";
import { ClasificacionPage } from "@/features/standings/ClasificacionPage";
import { PartidosPage } from "@/features/matches/PartidosPage";
import { ClubPage } from "@/features/club/ClubPage";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

type Tab = "inicio" | "clasificacion" | "partidos" | "club";

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "inicio",
    label: "Inicio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "clasificacion",
    label: "Clasificación",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "partidos",
    label: "Partidos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    id: "club",
    label: "Club",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [ready, setReady] = useState(false);

  const pages: Record<Tab, React.ReactNode> = {
    inicio: <HomePage onReady={() => setReady(true)} />,
    clasificacion: <ClasificacionPage />,
    partidos: <PartidosPage />,
    club: <ClubPage />,
  };

  return (
    <div id="app-root">
      {!ready && <LoadingScreen />}
      <div className="topbar" style={{ justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/escudo.png" alt="AD Ceuta" style={{ width: 40, height: 40, objectFit: "contain" }} />
      </div>

      <div className="scroll-area" key={tab}>
        {pages[tab]}
      </div>

      <div className="bottom-nav">
        {navItems.map((n) => (
          <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
            {n.icon}
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
