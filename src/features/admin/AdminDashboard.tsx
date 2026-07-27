'use client'

import { useState } from 'react'
import { AdminActions } from './AdminActions'
import { LiveControl } from './LiveControl'
import { MerchanToggle } from './MerchanToggle'
import { MvpAdmin } from './MvpAdmin'
import { PredictionAdmin } from './PredictionAdmin'
import { ActivityTimeline } from './ActivityTimeline'
import { NotifQueue } from './NotifQueue'
import { timeAgo } from '@/lib/formatters'

type RunLog = {
  id: number; created_at: string; status: string; duration_ms: number; cron_type?: string
  details: { articlesFound?: number; newArticles?: number; queued?: string | null; subscribers?: number; summary?: { source?: string; new?: number; count?: number; error?: string }[]; updated?: number; error?: string }
}
type NotifLog = { id: number; created_at: string; article_title: string; article_source: string; recipients: number; sent_ok: number; sent_fail: number }
type Sub = { endpoint: string; device: { icon: string; os: string; browser: string }; createdAt: string | null }

export type AdminStats = {
  subscribers: number
  totalNews: number
  deliveryRate: number | null
  lastNewsRun: RunLog | null
  lastMatchRun: { created_at: string; status: string } | null
  newsRuns: RunLog[]
  notifLogs: NotifLog[]
  newsBySource: [string, number][]
  subsHistory: { date: string; count: number }[]
  subsList: Sub[]
  deviceCount: Record<string, number>
  mvpSession: { status: 'pending' | 'open' | 'closed'; match_label: string } | null
}

function ModuleTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-extrabold text-xl tracking-[0.03em] uppercase text-ceuta-black flex items-center gap-2.5">
      <span className="w-1 h-5 bg-ceuta-red shrink-0 rounded-[2px]" />
      {children}
    </h2>
  )
}

function Module({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-ceuta-border rounded-[14px] overflow-hidden ${className}`}>
      {children}
    </section>
  )
}

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const newsOk = stats.lastNewsRun?.status === 'success'
  const matchOk = stats.lastMatchRun?.status === 'success'

  return (
    <>
      {/* Hero */}
      <section className="bg-ceuta-black text-white relative overflow-hidden">
        <div
          className="absolute top-0 right-[-40px] bottom-0 w-[420px] opacity-[0.08]"
          style={{
            background: 'repeating-linear-gradient(-45deg, #fff 0 14px, #000 14px 28px)',
            clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 md:py-9 relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-display text-[11px] md:text-[12.5px] font-bold tracking-[0.16em] uppercase text-ceuta-red flex items-center gap-2.5">
              <span className="w-5 h-0.5 bg-ceuta-red" />
              Panel de control
            </div>
            <h1 className="font-display font-black text-[32px] md:text-[46px] leading-[0.95] uppercase mt-2">
              Buenos días, <em className="not-italic text-ceuta-gold">míster.</em>
            </h1>
          </div>
          <div className="flex gap-2 md:gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/7 border border-white/14 rounded-full px-3 py-1.5 font-display text-[11px] md:text-[12.5px] font-semibold tracking-[0.06em] uppercase text-white/75">
              <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${newsOk ? 'bg-[#1E9E4B]' : 'bg-ceuta-red'}`} />
              Noticias · <b className="text-white">{timeAgo(stats.lastNewsRun?.created_at ?? null)}</b>
            </span>
            <span className="flex items-center gap-1.5 bg-white/7 border border-white/14 rounded-full px-3 py-1.5 font-display text-[11px] md:text-[12.5px] font-semibold tracking-[0.06em] uppercase text-white/75">
              <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${matchOk ? 'bg-[#1E9E4B]' : 'bg-ceuta-gold'}`} />
              Partidos · <b className="text-white">{timeAgo(stats.lastMatchRun?.created_at ?? null)}</b>
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6">
          <div className="bg-ceuta-red border border-ceuta-red rounded-[14px] p-4 md:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bottom-0 w-20 opacity-[0.06]"
              style={{ background: 'repeating-linear-gradient(-45deg, transparent 0 7px, #fff 7px 14px)' }} />
            <div className="font-display font-black text-[34px] md:text-[42px] leading-none text-white">{stats.subscribers}</div>
            <div className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-white/75 mt-1.5">Suscriptores</div>
            <div className="text-[11px] text-white/85 font-semibold mt-1">activos</div>
          </div>
          <div className="bg-ceuta-black border border-ceuta-black rounded-[14px] p-4 md:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bottom-0 w-20 opacity-[0.06]"
              style={{ background: 'repeating-linear-gradient(-45deg, transparent 0 7px, #fff 7px 14px)' }} />
            <div className="font-display font-black text-[34px] md:text-[42px] leading-none text-white">{stats.totalNews}</div>
            <div className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-white/75 mt-1.5">Noticias</div>
            <div className="text-[11px] text-white/85 font-semibold mt-1">esta temporada</div>
          </div>
          <div className="bg-white border border-ceuta-border rounded-[14px] p-4 md:p-5">
            <div className="font-display font-black text-[34px] md:text-[42px] leading-none text-ceuta-black">
              {stats.deliveryRate !== null ? `${stats.deliveryRate}` : '—'}<span className="text-[22px] md:text-[26px]">%</span>
            </div>
            <div className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-ceuta-muted mt-1.5">Entrega notif.</div>
            <div className="text-[11px] text-[#1E9E4B] font-semibold mt-1">Estable</div>
          </div>
          <div className="bg-white border border-ceuta-border rounded-[14px] p-4 md:p-5">
            <div className="font-display font-black text-[34px] md:text-[42px] leading-none text-ceuta-black">MVP</div>
            <div className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-ceuta-muted mt-1.5">
              {stats.mvpSession
                ? stats.mvpSession.status === 'open' ? 'Votación abierta'
                  : stats.mvpSession.status === 'closed' ? 'Cerrada'
                  : 'Pendiente'
                : 'Sin sesión'}
            </div>
            <div className="text-[12px] font-semibold mt-1.5 truncate" title={stats.mvpSession?.match_label}>
              {stats.mvpSession
                ? <span className={stats.mvpSession.status === 'open' ? 'text-[#1E9E4B]' : 'text-ceuta-muted'}>{stats.mvpSession.match_label}</span>
                : <span className="text-ceuta-muted">ver módulo →</span>}
            </div>
          </div>
        </div>

        {/* Cola notificaciones */}
        <div className="mt-5">
          <NotifQueue />
        </div>

        {/* Main 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 pt-6 pb-16">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* Sincronización */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Sincronización de datos</ModuleTitle>
              </div>
              <div className="px-5 pb-5 mt-4">
                <AdminActions syncOnly />
              </div>
            </Module>

            {/* Notificación manual */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Notificación manual</ModuleTitle>
              </div>
              <p className="text-[13px] text-ceuta-muted px-5 pt-1 pl-[34px]">
                Se enviará a los {stats.subscribers} suscriptores con alertas activas.
              </p>
              <div className="px-5 pb-5 mt-4">
                <AdminActions notifOnly />
              </div>
            </Module>

            {/* Actividad reciente */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Actividad reciente</ModuleTitle>
              </div>
              <div className="px-5 pb-5 mt-4">
                <ActivityTimeline />
              </div>
            </Module>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* Live */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Partido en vivo</ModuleTitle>
              </div>
              <div className="px-5 pb-5 mt-4">
                <LiveControl />
                <MerchanToggle />
              </div>
            </Module>

            {/* MVP */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>MVP del partido</ModuleTitle>
              </div>
              <div className="px-5 pb-5 mt-4">
                <MvpAdmin />
              </div>
            </Module>

            {/* Quiniela */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Quiniela</ModuleTitle>
              </div>
              <p className="text-[13px] text-ceuta-muted px-5 pt-1 pl-[34px]">Historial de predicciones de resultado.</p>
              <div className="px-5 pb-5 mt-4">
                <PredictionAdmin />
              </div>
            </Module>

            {/* Este dispositivo */}
            <Module>
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <ModuleTitle>Este dispositivo</ModuleTitle>
              </div>
              <div className="px-5 pb-5 mt-4">
                <AdminActions deviceOnly />
              </div>
            </Module>

            {/* Suscriptores por dispositivo */}
            {Object.keys(stats.deviceCount).length > 0 && (
              <Module>
                <div className="flex items-center justify-between gap-3 px-5 pt-5">
                  <ModuleTitle>Suscriptores</ModuleTitle>
                  <span className="font-display text-[11px] font-bold text-ceuta-muted">{stats.subscribers} total</span>
                </div>
                <div className="px-5 pb-5 mt-4 space-y-2">
                  {Object.entries(stats.deviceCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, count]) => {
                      const pct = stats.subscribers > 0 ? Math.round((count / stats.subscribers) * 100) : 0
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display text-[12px] font-bold text-ceuta-black">{key}</span>
                            <span className="font-display text-[11px] text-ceuta-muted">{count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 bg-ceuta-bg-mid rounded-full overflow-hidden">
                            <div className="h-full bg-ceuta-black rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  {stats.subsList.length > 0 && (
                    <div className="pt-2 border-t border-ceuta-border">
                      <div className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-ceuta-muted mb-2">Recientes</div>
                      <div className="space-y-1.5">
                        {stats.subsList.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <span className="text-[14px] shrink-0">{s.device.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-display text-[11px] font-bold text-ceuta-black truncate">
                                {s.device.os} · {s.device.browser}
                              </div>
                            </div>
                            {s.createdAt && (
                              <span className="font-display text-[10px] text-ceuta-muted shrink-0">
                                {timeAgo(s.createdAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Module>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
