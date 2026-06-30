'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Transfer, TransferType } from '@/infrastructure/supabase/TransfersRepository'

const TABS: { id: TransferType; lbl: string; cls: string }[] = [
  { id: 'renew', lbl: 'Renovados', cls: 'ren' },
  { id: 'in',    lbl: 'Fichados',  cls: 'in' },
  { id: 'out',   lbl: 'Salidas',   cls: 'out' },
  { id: 'rumor', lbl: 'Rumores',   cls: 'rum' },
]

const HEAD_TITLE: Record<TransferType, string> = {
  renew: 'Renovaciones',
  in:    'Altas confirmadas',
  out:   'Bajas y salidas',
  rumor: 'En el radar',
}

const POSITION_LABEL: Record<string, string> = {
  POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista',
  DEL: 'Delantero', ENT: 'Entrenador',
}

function typeToClass(type: TransferType) {
  return { in: 'in', out: 'out', renew: 'ren', rumor: 'rum' }[type]
}

// DB: reliability 1 = confirmado, 2 = probable, 3 = especulación
// Design flames: 3 = muy fiable, 2 = posible, 1 = especulación → invert
function flamesToShow(rel: number) { return 4 - rel }
const REL_TEXT: Record<number, string> = { 1: 'Especulación', 2: 'Posible', 3: 'Muy fiable' }

function ArrowIn() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
}
function Renew() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
}
function ArrowOut() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
}
function Check() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
}
function Flame({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" style={{ color: on ? 'var(--red)' : 'var(--bg-mid)' }}>
      <path d="M12 2c0 4-4 5-4 9a4 4 0 008 0c0-1.2-.5-2-1-2.8.3 1.4-.3 2.3-1 2.3.6-2.3-1-3.5-1-5.5 0-1.5 0-3-1-5z"/>
    </svg>
  )
}

function TransferCard({ t }: { t: Transfer }) {
  const cls = typeToClass(t.type)
  const routeClub = t.type === 'in' ? t.clubFrom : t.type === 'out' ? t.clubTo : t.type === 'renew' ? 'AD Ceuta FC' : (t.clubFrom ?? t.clubTo)
  const routeLabel = t.type === 'in' ? 'Procede de' : t.type === 'out' ? 'Destino' : t.type === 'renew' ? 'Continúa en' : 'Suena desde'
  const flames = flamesToShow(t.reliability)
  const relText = REL_TEXT[flames] ?? ''

  return (
    <div className={`tcard ${cls}`}>
      <div className="tcard-top">
        <div className="tcard-photo">
          {t.photoUrl ? (
            <Image
              src={t.photoUrl.includes('supabase.co') ? t.photoUrl : `/api/proxy/image?url=${encodeURIComponent(t.photoUrl)}&w=116`}
              alt={t.name} fill sizes="58px"
              className="object-cover object-top" unoptimized
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
              {t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="tcard-id">
          <div className="tcard-name">{t.name}</div>
          <div className="tcard-sub">
            <span className="pos-chip">{POSITION_LABEL[t.position] ?? t.position}</span>
          </div>
        </div>

        {t.type === 'renew' && <span className="tcard-badge badge-renueva"><Renew />Renovado</span>}
        {t.type === 'in'    && <span className="tcard-badge badge-oficial"><Check />Oficial</span>}
        {t.type === 'out'   && <span className="tcard-badge badge-salida">Salida</span>}
        {t.type === 'rumor' && <span className="tcard-badge badge-rumor">Rumor</span>}
      </div>

      {routeClub && (
        <div className="tcard-route">
          <div className="route-arrow">
            {t.type === 'out' ? <ArrowOut /> : t.type === 'renew' ? <Renew /> : <ArrowIn />}
          </div>
          <div className="route-info">
            <div className="route-label">{routeLabel}</div>
            <div className="route-club">{routeClub}</div>
          </div>
          {t.notes && <div className="route-fee">{t.notes}</div>}
        </div>
      )}
      {!routeClub && t.notes && (
        <div className="tcard-route">
          <div className="route-info">
            <div className="route-club" style={{ fontSize: 13, fontWeight: 500, textTransform: 'none', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>{t.notes}</div>
          </div>
        </div>
      )}

      {t.type === 'rumor' && (
        <div className="rel-meter">
          <span className="rel-label">Fiabilidad</span>
          <div className="rel-flames">
            {[1, 2, 3].map(i => <Flame key={i} on={i <= flames} />)}
          </div>
          <span className={`rel-text t${flames}`}>{relText}</span>
        </div>
      )}
    </div>
  )
}

export default function MercadoClient({ transfers }: { transfers: Transfer[] }) {
  const [activeTab, setActiveTab] = useState<TransferType>('renew')
  const filtered = transfers.filter(t => t.type === activeTab)
  const count = (type: TransferType) => transfers.filter(t => t.type === type).length

  return (
    <>
      <style>{`
        :root {
          --green: #1E7F47;
          --green-soft: #E4F3EA;
          --bg-mid: #ECEAE4;
          --red-soft: #FFE9EA;
          --red-dark: #A8161C;
          --radius: 14px;
          --radius-sm: 8px;
        }

        .mkt-hero {
          position: relative; background: var(--black); color: var(--white);
          padding: 24px 18px 64px; overflow: hidden;
        }
        .mkt-hero::before {
          content: ''; position: absolute; top: -30px; right: -50px;
          width: 200px; height: 200px;
          background: repeating-linear-gradient(-45deg, var(--white) 0 14px, var(--black) 14px 28px);
          clip-path: polygon(70px 0, 100% 0, 100% 100%, 0 100%);
          opacity: 0.07; transform: rotate(8deg); pointer-events: none;
        }
        .mkt-eyebrow {
          font-family: var(--font-display); font-size: 11px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--red);
          display: flex; align-items: center; gap: 8px;
        }
        .mkt-eyebrow::before { content: ''; width: 18px; height: 2px; background: var(--red); }
        .mkt-title {
          font-family: var(--font-display); font-weight: 900; font-size: 40px;
          line-height: 0.92; letter-spacing: -0.01em; margin-top: 10px;
          text-transform: uppercase; position: relative; z-index: 1;
        }
        .mkt-title em { font-style: normal; color: var(--gold); }
        .mkt-window {
          font-family: var(--font-body); font-size: 12.5px; color: rgba(255,255,255,0.6);
          margin-top: 10px; display: flex; align-items: center; gap: 7px;
        }
        .mkt-window .dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 0 3px rgba(30,127,71,0.25);
        }

        .mkt-counters {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
          margin: -44px 12px 0; position: relative; z-index: 3;
        }
        .mkt-count-pill {
          background: var(--white); border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 13px 6px 11px; text-align: center;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08); position: relative; overflow: hidden;
        }
        .mkt-count-pill::after {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 4px;
        }
        .mkt-count-pill.ren::after { background: var(--green); }
        .mkt-count-pill.in::after  { background: var(--red); }
        .mkt-count-pill.out::after { background: var(--black); }
        .mkt-count-pill.rum::after { background: var(--gold); }
        .mkt-count-num {
          font-family: var(--font-display); font-weight: 900; font-size: 30px;
          line-height: 0.9; color: var(--black);
        }
        .mkt-count-lbl {
          font-family: var(--font-display); font-size: 9px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-top: 5px;
        }

        .mkt-tabs {
          display: flex; gap: 5px; padding: 18px 10px 6px;
          position: sticky; top: 58px; z-index: 50; background: var(--bg);
        }
        .mkt-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 9px 4px 8px; border-radius: var(--radius);
          border: 1.5px solid var(--border); background: var(--white);
          transition: all 0.16s; -webkit-tap-highlight-color: transparent;
        }
        .mkt-tab-lbl {
          font-family: var(--font-display); font-size: 12px; font-weight: 700;
          letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); white-space: nowrap;
        }
        .mkt-tab-cnt {
          font-family: var(--font-display); font-size: 11px; font-weight: 700;
          color: var(--bg-mid); transition: color 0.16s;
        }
        .mkt-tab.active.ren { background: var(--green); border-color: var(--green); }
        .mkt-tab.active.in  { background: var(--red); border-color: var(--red); }
        .mkt-tab.active.out { background: var(--black); border-color: var(--black); }
        .mkt-tab.active.rum { background: var(--gold); border-color: var(--gold); }
        .mkt-tab.active .mkt-tab-lbl { color: var(--white); }
        .mkt-tab.active.rum .mkt-tab-lbl { color: var(--black); }
        .mkt-tab.active .mkt-tab-cnt { color: rgba(255,255,255,0.7); }
        .mkt-tab.active.rum .mkt-tab-cnt { color: rgba(0,0,0,0.55); }

        .tcards { padding: 8px 12px 0; display: flex; flex-direction: column; gap: 10px; }
        .tcard {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 14px 15px 13px;
          position: relative; overflow: hidden;
          animation: cardIn 0.36s ease backwards;
        }
        .tcard::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .tcard.ren::before { background: var(--green); }
        .tcard.in::before  { background: var(--red); }
        .tcard.out::before { background: var(--black); }
        .tcard.rum { border-style: dashed; border-color: #D9D5CC; }
        .tcard.rum::before { background: var(--gold); }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
        .tcard:nth-child(1){animation-delay:.02s}.tcard:nth-child(2){animation-delay:.06s}
        .tcard:nth-child(3){animation-delay:.10s}.tcard:nth-child(4){animation-delay:.14s}
        .tcard:nth-child(5){animation-delay:.18s}.tcard:nth-child(6){animation-delay:.22s}

        .tcard-top { display: flex; align-items: center; gap: 13px; }
        .tcard-photo {
          width: 58px; height: 58px; border-radius: 50%; flex-shrink: 0;
          overflow: hidden; position: relative; background: var(--bg-soft);
          border: 2px solid var(--white); box-shadow: 0 0 0 1.5px var(--border);
        }
        .tcard.in .tcard-photo  { box-shadow: 0 0 0 2px var(--red); }
        .tcard.ren .tcard-photo { box-shadow: 0 0 0 2px var(--green); }
        .tcard-id { flex: 1; min-width: 0; }
        .tcard-name {
          font-family: var(--font-display); font-weight: 800; font-size: 19px;
          line-height: 1; letter-spacing: 0.01em; text-transform: uppercase; color: var(--black);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tcard-sub { display: flex; align-items: center; gap: 7px; margin-top: 7px; flex-wrap: wrap; }
        .pos-chip {
          font-family: var(--font-display); font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--white);
          background: var(--red); padding: 3px 8px; border-radius: 4px; flex-shrink: 0;
        }
        .tcard.out .pos-chip { background: var(--black); }
        .tcard.ren .pos-chip { background: var(--green); }
        .tcard.rum .pos-chip { background: var(--bg-mid); color: var(--black); }

        .tcard-badge {
          font-family: var(--font-display); font-size: 10px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 5px 9px; border-radius: 5px; flex-shrink: 0; align-self: flex-start;
          display: flex; align-items: center; gap: 4px;
        }
        .tcard-badge svg { width: 11px; height: 11px; }
        .badge-oficial { background: var(--black); color: var(--white); }
        .badge-renueva { background: var(--green-soft); color: var(--green); }
        .badge-salida  { background: var(--red-soft); color: var(--red-dark); }
        .badge-rumor   { background: var(--bg-mid); color: var(--muted); }

        .tcard-route {
          display: flex; align-items: center; gap: 10px;
          margin-top: 13px; padding: 10px 12px;
          background: var(--bg-soft); border-radius: var(--radius-sm);
        }
        .route-arrow {
          width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: var(--white);
        }
        .route-arrow svg { width: 15px; height: 15px; }
        .tcard.in .route-arrow  { background: var(--red); }
        .tcard.ren .route-arrow { background: var(--green); }
        .tcard.out .route-arrow { background: var(--black); }
        .tcard.rum .route-arrow { background: var(--gold); color: var(--black); }
        .route-info { flex: 1; min-width: 0; }
        .route-label {
          font-family: var(--font-display); font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
        }
        .route-club {
          font-family: var(--font-display); font-size: 15px; font-weight: 700;
          letter-spacing: 0.02em; text-transform: uppercase; color: var(--black);
          line-height: 1.05; margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .route-fee {
          font-family: var(--font-body); font-size: 11px; font-weight: 500;
          color: var(--muted); flex-shrink: 0; text-align: right;
          max-width: 100px; line-height: 1.3;
        }

        .rel-meter {
          display: flex; align-items: center; gap: 9px;
          margin-top: 13px; padding-top: 12px; border-top: 1px dashed var(--border);
        }
        .rel-label {
          font-family: var(--font-display); font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
        }
        .rel-flames { display: flex; gap: 4px; }
        .rel-text {
          font-family: var(--font-display); font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; margin-left: auto;
        }
        .rel-text.t3 { color: var(--red); }
        .rel-text.t2 { color: var(--gold); }
        .rel-text.t1 { color: var(--muted); }

        .list-head {
          padding: 18px 16px 4px; display: flex; align-items: baseline;
          justify-content: space-between;
        }
        .list-head-title {
          font-family: var(--font-display); font-weight: 800; font-size: 16px;
          letter-spacing: 0.02em; text-transform: uppercase; color: var(--black);
        }
        .list-head-cnt { font-family: var(--font-body); font-size: 12px; color: var(--muted); }

        /* Desktop */
        @media (min-width: 768px) {
          .mkt-hero { padding: 32px 24px 80px; }
          .mkt-title { font-size: 52px; }
          .mkt-counters { margin: -50px 0 0; }
          .tcards { padding: 8px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .list-head { padding: 18px 0 4px; }
          .mkt-tabs { padding: 18px 0 6px; top: 72px; }
        }
      `}</style>

      <div className="page" style={{ paddingBottom: 80 }}>
        {/* Hero */}
        <div className="mkt-hero">
          <div className="mkt-eyebrow">Temporada 2025–26</div>
          <div className="mkt-title">MERCADO DE<br /><em>FICHAJES</em></div>
          <div className="mkt-window">
            <span className="dot" />
            Ventana de verano abierta · cierre 1 sep
          </div>
        </div>

        {/* Counter pills */}
        <div className="mkt-counters">
          {TABS.map(tab => (
            <div key={tab.id} className={`mkt-count-pill ${tab.cls}`}>
              <div className="mkt-count-num">{count(tab.id)}</div>
              <div className="mkt-count-lbl">{tab.lbl}</div>
            </div>
          ))}
        </div>

        <div className="page" style={{ paddingBottom: 0 }}>
          {/* Sticky tabs */}
          <div className="mkt-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`mkt-tab ${tab.cls} ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mkt-tab-lbl">{tab.lbl}</span>
                <span className="mkt-tab-cnt">{count(tab.id)}</span>
              </button>
            ))}
          </div>

          {/* List header */}
          <div className="list-head">
            <span className="list-head-title">{HEAD_TITLE[activeTab]}</span>
            <span className="list-head-cnt">{filtered.length} movimientos</span>
          </div>

          {/* Cards */}
          <div className="tcards" key={activeTab}>
            {filtered.map(t => <TransferCard key={t.id} t={t} />)}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                Sin movimientos en esta categoría
              </div>
            )}
          </div>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </>
  )
}
