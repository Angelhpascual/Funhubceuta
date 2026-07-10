'use client'

import { useState, useRef, useCallback } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { MvpAdmin } from './MvpAdmin'
import { PredictionAdmin } from './PredictionAdmin'

type Status = 'idle' | 'running' | 'ok' | 'error'

type CronLog = {
  id: number
  created_at: string
  cron_type: string
  status: string
  duration_ms: number
  details: Record<string, unknown>
}

async function callTrigger(action: string, payload?: unknown) {
  const res = await fetch('/api/admin/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error')
  return data.result
}

function useCronPoller() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  return useCallback(
    (cronType: string, since: number, onDone: (log: CronLog) => void, onTimeout: () => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const deadline = Date.now() + 90_000
      intervalRef.current = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(intervalRef.current!)
          onTimeout()
          return
        }
        try {
          const res = await fetch('/api/admin/activity')
          if (!res.ok) return
          const data = await res.json()
          const logs: CronLog[] = data.logs ?? []
          const found = logs.find(
            (l) => l.cron_type === cronType && new Date(l.created_at).getTime() > since
          )
          if (found) {
            clearInterval(intervalRef.current!)
            onDone(found)
          }
        } catch { /* keep polling */ }
      }, 2500)
    },
    []
  )
}

function buildResult(log: CronLog): { lines: string[]; ok: boolean } {
  const d = log.details
  const ok = log.status === 'success'
  if (!ok) return { lines: [(d.error as string) ?? 'Error desconocido'], ok: false }

  const lines: string[] = []

  // News
  if (typeof d.newArticles === 'number') {
    lines.push(`${d.newArticles} nuevas · ${d.articlesFound ?? '?'} encontradas`)
  }
  if (d.queued) lines.push(`📬 Cola: ${d.queued}`)
  if ((d.imageErrors as unknown[])?.length) {
    lines.push(`⚠️ ${(d.imageErrors as unknown[]).length} fotos con error`)
  }

  // Matches
  if (typeof d.count === 'number') lines.push(`${d.count} partidos sincronizados`)

  // Images / stats
  if (typeof d.updated === 'number') lines.push(`${d.updated} jugadores actualizados`)
  if (typeof d.optimizedNewImages === 'number' && d.optimizedNewImages > 0) {
    lines.push(`${d.optimizedNewImages} fotos optimizadas`)
  }
  if (d.warning) lines.push(`⚠️ ${d.warning}`)

  // Duration
  if (log.duration_ms) lines.push(`${(log.duration_ms / 1000).toFixed(1)}s`)

  return { lines: lines.length > 0 ? lines : ['OK'], ok: true }
}

type SyncState = {
  status: Status
  phase: string
  result: { lines: string[]; ok: boolean } | null
  elapsed: number
}
const IDLE: SyncState = { status: 'idle', phase: '', result: null, elapsed: 0 }

function SyncCard({
  emoji, label, description, state,
  onClick,
}: {
  emoji: string
  label: string
  description: string
  state: SyncState
  onClick: () => void
}) {
  const busy = state.status === 'running'
  const done = state.status === 'ok' || state.status === 'error'
  const isError = state.status === 'error'

  return (
    <div className={`rounded-[14px] border-2 transition-colors ${
      isError ? 'border-ceuta-red bg-red-50' :
      state.status === 'ok' ? 'border-green-500 bg-green-50' :
      busy ? 'border-ceuta-black bg-white' :
      'border-ceuta-border bg-white'
    }`}>
      <button
        onClick={onClick}
        disabled={busy}
        className="w-full text-left p-4 disabled:cursor-not-allowed"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[22px] leading-none">{busy ? '⏳' : emoji}</span>
            <div>
              <div className={`text-[14px] font-bold ${
                isError ? 'text-ceuta-red' :
                state.status === 'ok' ? 'text-green-700' :
                'text-ceuta-black'
              }`}>{label}</div>
              <div className="text-[11px] text-ceuta-muted mt-0.5">{description}</div>
            </div>
          </div>
          {!busy && !done && (
            <div className="shrink-0 bg-ceuta-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              Ejecutar
            </div>
          )}
          {busy && (
            <div className="shrink-0 text-[10px] font-bold text-ceuta-muted tabular-nums">
              {state.elapsed}s
            </div>
          )}
        </div>
      </button>

      {/* Progress */}
      {busy && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-ceuta-black animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-ceuta-black font-medium">{state.phase}</span>
          </div>
          <div className="w-full h-0.5 bg-ceuta-border rounded-full overflow-hidden">
            <div className="h-full bg-ceuta-black rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Result */}
      {done && state.result && (
        <div className="px-4 pb-4 space-y-1">
          {state.result.lines.map((line, i) => (
            <div key={i} className={`text-[12px] font-medium ${isError ? 'text-ceuta-red' : 'text-green-700'}`}>
              {i === 0 && (isError ? '✗ ' : '✓ ')}{line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminActions() {
  const router = useRouter()
  const poll = useCronPoller()
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [syncNews, setSyncNews] = useState<SyncState>(IDLE)
  const [syncMatches, setSyncMatches] = useState<SyncState>(IDLE)
  const [syncImages, setSyncImages] = useState<SyncState>(IDLE)

  const [customTitle, setCustomTitle] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customUrl, setCustomUrl] = useState('/')
  const [customStatus, setCustomStatus] = useState<Status>('idle')
  const [customResult, setCustomResult] = useState('')

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<'idle' | 'running' | 'ok' | 'error' | 'unsupported'>('idle')
  const [deviceMsg, setDeviceMsg] = useState('')

  function startElapsed(set: React.Dispatch<React.SetStateAction<SyncState>>) {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    let t = 0
    elapsedRef.current = setInterval(() => {
      t += 1
      set((prev) => ({ ...prev, elapsed: t }))
    }, 1000)
  }

  function stopElapsed() {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
  }

  async function triggerSync(
    set: React.Dispatch<React.SetStateAction<SyncState>>,
    action: string,
    cronType: string,
    phases: string[]
  ) {
    set({ status: 'running', phase: phases[0], result: null, elapsed: 0 })
    startElapsed(set)
    const since = Date.now()

    // Phase cycling while waiting
    let phaseIdx = 0
    const phaseInterval = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, phases.length - 1)
      set((prev) => ({ ...prev, phase: phases[phaseIdx] }))
    }, 4000)

    try {
      await callTrigger(action)
    } catch (e) {
      clearInterval(phaseInterval)
      stopElapsed()
      set({ status: 'error', phase: '', result: { lines: [(e as Error).message], ok: false }, elapsed: 0 })
      setTimeout(() => set(IDLE), 8000)
      return
    }

    poll(
      cronType,
      since,
      (log) => {
        clearInterval(phaseInterval)
        stopElapsed()
        const result = buildResult(log)
        set({ status: result.ok ? 'ok' : 'error', phase: '', result, elapsed: 0 })
        setTimeout(() => set(IDLE), 10000)
      },
      () => {
        clearInterval(phaseInterval)
        stopElapsed()
        set({ status: 'error', phase: '', result: { lines: ['Sin respuesta del servidor'], ok: false }, elapsed: 0 })
        setTimeout(() => set(IDLE), 8000)
      }
    )
  }

  async function sendCustomPush() {
    if (!customTitle.trim() || !customBody.trim()) return
    setCustomStatus('running')
    try {
      const result = await callTrigger('push', {
        title: customTitle, body: customBody, tag: 'custom', url: customUrl || '/',
      })
      setCustomResult(`Enviada a ${result?.sent ?? 0} suscriptores`)
      setCustomStatus('ok')
      setCustomTitle('')
      setCustomBody('')
      setCustomUrl('/')
    } catch (e) {
      setCustomResult((e as Error).message)
      setCustomStatus('error')
    }
    setTimeout(() => setCustomStatus('idle'), 6000)
  }

  async function registerDevice() {
    setDeviceStatus('running')
    setDeviceMsg('Comprobando permisos…')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setDeviceStatus('unsupported')
        setDeviceMsg('Push no disponible en este navegador')
        return
      }
      await navigator.serviceWorker.register('/sw.js')
      setDeviceMsg('Registrando service worker…')
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 8000)),
      ])
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setDeviceMsg('Solicitando permiso de notificaciones…')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setDeviceStatus('error')
          setDeviceMsg('Permiso denegado')
          return
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) { setDeviceStatus('error'); setDeviceMsg('Falta VAPID key'); return }
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey })
        setDeviceMsg('Guardando suscripción…')
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
      }
      const res = await fetch('/api/admin/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      if (res.ok) { setDeviceStatus('ok'); setDeviceMsg('Dispositivo registrado — recibirás alertas aquí') }
      else { setDeviceStatus('error'); setDeviceMsg('Error al registrar en el servidor') }
    } catch (e) {
      setDeviceStatus('error')
      setDeviceMsg((e as Error).message ?? 'Error desconocido')
    }
    setTimeout(() => { setDeviceStatus('idle'); setDeviceMsg('') }, 6000)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  return (
    <div className="space-y-6">

      {/* Sincronización */}
      <section>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-muted mb-3">Sincronización de datos</p>
        <div className="space-y-2">
          <SyncCard
            emoji="📰"
            label="Noticias"
            description="Scraper RSS + imágenes. Encola para notificación."
            state={syncNews}
            onClick={() => triggerSync(setSyncNews, 'news', 'news', [
              'Lanzando scraper…',
              'Procesando fuentes RSS…',
              'Descargando imágenes…',
              'Finalizando…',
            ])}
          />
          <SyncCard
            emoji="⚽"
            label="Partidos"
            description="Actualiza próximos partidos y resultados."
            state={syncMatches}
            onClick={() => triggerSync(setSyncMatches, 'matches', 'matches', [
              'Consultando calendario…',
              'Actualizando resultados…',
            ])}
          />
          <SyncCard
            emoji="🖼️"
            label="Fotos de plantilla"
            description="Optimiza fotos de jugadores pendientes."
            state={syncImages}
            onClick={() => triggerSync(setSyncImages, 'backfill-images', 'backfill-images', [
              'Buscando fotos sin optimizar…',
              'Procesando y guardando…',
            ])}
          />
        </div>
      </section>

      {/* Notificación manual */}
      <section>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-muted mb-3">Notificación manual</p>
        <div className="bg-white rounded-[14px] border-2 border-ceuta-border p-4 space-y-3">
          <input
            type="text"
            placeholder="Título"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black"
          />
          <textarea
            placeholder="Mensaje"
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            rows={2}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black resize-none"
          />
          <input
            type="text"
            placeholder="URL destino (ej: /partidos)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black"
          />
          <button
            onClick={sendCustomPush}
            disabled={customStatus === 'running' || !customTitle.trim() || !customBody.trim()}
            className={`w-full rounded-xl py-3 text-[13px] font-bold transition-colors disabled:opacity-50 ${
              customStatus === 'ok' ? 'bg-green-600 text-white' :
              customStatus === 'error' ? 'bg-ceuta-red text-white' :
              'bg-ceuta-black text-white'
            }`}
          >
            {customStatus === 'running' ? '⏳ Enviando…' :
             customStatus === 'ok' ? `✓ ${customResult}` :
             customStatus === 'error' ? `✗ ${customResult}` :
             '🔔 Enviar a todos los suscriptores'}
          </button>
        </div>
      </section>

      {/* Este dispositivo + logout */}
      <section>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ceuta-muted mb-3">Este dispositivo</p>
        <div className="space-y-2">
          <button
            onClick={registerDevice}
            disabled={deviceStatus === 'running'}
            className={`w-full rounded-[14px] border-2 p-4 text-left transition-colors disabled:opacity-60 ${
              deviceStatus === 'ok' ? 'border-green-500 bg-green-50' :
              deviceStatus === 'error' || deviceStatus === 'unsupported' ? 'border-ceuta-red bg-red-50' :
              'border-ceuta-border bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[22px]">📲</span>
              <div>
                <div className={`text-[14px] font-bold ${
                  deviceStatus === 'ok' ? 'text-green-700' :
                  deviceStatus === 'error' || deviceStatus === 'unsupported' ? 'text-ceuta-red' :
                  'text-ceuta-black'
                }`}>
                  {deviceStatus === 'ok' ? '✓ Dispositivo registrado' :
                   deviceStatus === 'error' || deviceStatus === 'unsupported' ? `✗ ${deviceMsg}` :
                   'Activar alertas en este dispositivo'}
                </div>
                <div className="text-[11px] text-ceuta-muted mt-0.5">
                  {deviceStatus === 'running' ? deviceMsg :
                   deviceStatus === 'ok' ? deviceMsg :
                   'Recibirás notificaciones cuando lleguen noticias nuevas'}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full rounded-[14px] border-2 border-ceuta-border bg-white p-4 text-left text-[14px] font-bold text-ceuta-muted disabled:opacity-50 transition-colors hover:border-ceuta-red hover:text-ceuta-red"
          >
            {logoutLoading ? '⏳ Saliendo…' : '← Cerrar sesión'}
          </button>
        </div>
      </section>

      {/* MVP Voting */}
      <section>
        <MvpAdmin />
      </section>

      {/* Predicciones */}
      <section>
        <PredictionAdmin />
      </section>

    </div>
  )
}
