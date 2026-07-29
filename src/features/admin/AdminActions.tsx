'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

  // Player stats
  if (typeof d.updated === 'number') lines.push(`${d.updated} jugadores actualizados`)
  // Backfill news images
  if (typeof d.optimized === 'number') lines.push(`${d.optimized} fotos optimizadas`)
  if (typeof d.recovered === 'number' && d.recovered > 0) lines.push(`${d.recovered} fotos recuperadas`)
  if (typeof d.pending === 'number' && d.pending > 0) lines.push(`${d.pending} pendientes`)
  // Legacy field name
  if (typeof d.optimizedNewImages === 'number' && d.optimizedNewImages > 0) {
    lines.push(`${d.optimizedNewImages} fotos optimizadas`)
  }
  // Squad photos
  if (typeof d.failed === 'number' && d.failed > 0) lines.push(`⚠️ ${d.failed} fallidas`)
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

export function AdminActions({ syncOnly, notifOnly, deviceOnly }: { syncOnly?: boolean; notifOnly?: boolean; deviceOnly?: boolean } = {}) {
  const router = useRouter()
  const poll = useCronPoller()
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const [syncNews, setSyncNews] = useState<SyncState>(IDLE)
  const [syncNewsImages, setSyncNewsImages] = useState<SyncState>(IDLE)

  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushUrl, setPushUrl] = useState('/')
  const [pushEnv, setPushEnv] = useState<'production' | 'development'>('production')
  const [pushStatus, setPushStatus] = useState<Status>('idle')
  const [pushResult, setPushResult] = useState('')

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
    phases: string[],
    opts: { direct?: boolean } = {}
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

    let directResult: Record<string, unknown> | undefined
    try {
      directResult = await callTrigger(action)
    } catch (e) {
      clearInterval(phaseInterval)
      stopElapsed()
      set({ status: 'error', phase: '', result: { lines: [(e as Error).message], ok: false }, elapsed: 0 })
      setTimeout(() => { if (mountedRef.current) set(IDLE) }, 8000)
      return
    }

    // For direct actions the job already ran — use the response directly
    if (opts.direct && directResult) {
      clearInterval(phaseInterval)
      stopElapsed()
      const lines: string[] = []
      const raw = directResult as Record<string, unknown>
      const d = (raw.result ?? raw) as Record<string, unknown>
      if (typeof d.optimized === 'number') lines.push(`${d.optimized} fotos optimizadas`)
      if (typeof d.recovered === 'number' && d.recovered > 0) lines.push(`${d.recovered} fotos recuperadas`)
      if (typeof d.pending === 'number' && d.pending > 0) lines.push(`${d.pending} pendientes`)
      if (typeof d.failed === 'number' && d.failed > 0) lines.push(`⚠️ ${d.failed} fallidas`)
      if (Array.isArray(d.errors) && d.errors.length > 0) {
        d.errors.slice(0, 3).forEach((e: unknown) => lines.push(`· ${String(e).slice(0, 70)}`))
      }
      if (lines.length === 0) lines.push('OK')
      const hasError = typeof d.failed === 'number' && d.failed > 0
      set({ status: hasError ? 'error' : 'ok', phase: '', result: { lines, ok: !hasError }, elapsed: 0 })
      setTimeout(() => { if (mountedRef.current) set(IDLE) }, 15000)
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
        setTimeout(() => { if (mountedRef.current) set(IDLE) }, 10000)
      },
      () => {
        clearInterval(phaseInterval)
        stopElapsed()
        set({ status: 'error', phase: '', result: { lines: ['Sin respuesta del servidor'], ok: false }, elapsed: 0 })
        setTimeout(() => { if (mountedRef.current) set(IDLE) }, 8000)
      }
    )
  }

  async function sendPush() {
    if (!pushTitle.trim() || !pushBody.trim()) return
    setPushStatus('running')
    try {
      const action = pushEnv === 'production' ? 'push' : 'push-dev'
      const result = await callTrigger(action, {
        title: pushTitle, body: pushBody, tag: pushEnv === 'development' ? 'dev-test' : 'custom', url: pushUrl || '/',
      })
      setPushResult(`Enviada a ${result?.sent ?? 0} suscriptores`)
      setPushStatus('ok')
      setPushTitle('')
      setPushBody('')
      setPushUrl('/')
    } catch (e) {
      setPushResult((e as Error).message)
      setPushStatus('error')
    }
    setTimeout(() => { if (mountedRef.current) setPushStatus('idle') }, 6000)
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
      }
      setDeviceMsg('Guardando suscripción…')
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
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
    setTimeout(() => { if (mountedRef.current) { setDeviceStatus('idle'); setDeviceMsg('') } }, 6000)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const showSync = !notifOnly && !deviceOnly
  const showNotif = !syncOnly && !deviceOnly
  const showDevice = !syncOnly && !notifOnly
  const showMvp = !syncOnly && !notifOnly && !deviceOnly

  return (
    <div className="space-y-6">

      {/* Sincronización */}
      {showSync && <section>
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
            emoji="🖼️"
            label="Optimizar fotos noticias"
            description="Migra y convierte a WebP las imágenes externas de noticias."
            state={syncNewsImages}
            onClick={() => triggerSync(setSyncNewsImages, 'backfill-news-images', 'backfill-images', [
              'Buscando fotos externas en noticias…',
              'Descargando y convirtiendo a WebP…',
              'Actualizando base de datos…',
            ], { direct: true })}
          />
        </div>
      </section>}

      {/* Notificación manual — formulario unificado */}
      {showNotif && <section>
        <div className={`bg-white rounded-[14px] border-2 p-4 space-y-3 transition-colors ${pushEnv === 'development' ? 'border-amber-300' : 'border-ceuta-border'}`}>
          {/* Toggle entorno */}
          <div className="flex gap-1 p-1 bg-ceuta-bg-soft rounded-xl">
            <button
              type="button"
              onClick={() => setPushEnv('production')}
              className={`flex-1 py-2 rounded-lg font-display text-[11px] font-bold tracking-[0.08em] uppercase transition-all ${
                pushEnv === 'production' ? 'bg-ceuta-black text-white shadow-sm' : 'text-ceuta-muted'
              }`}
            >
              🔔 Producción
            </button>
            <button
              type="button"
              onClick={() => setPushEnv('development')}
              className={`flex-1 py-2 rounded-lg font-display text-[11px] font-bold tracking-[0.08em] uppercase transition-all ${
                pushEnv === 'development' ? 'bg-amber-500 text-white shadow-sm' : 'text-ceuta-muted'
              }`}
            >
              🧪 Develop
            </button>
          </div>

          <input
            type="text"
            placeholder="Título"
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black"
          />
          <textarea
            placeholder="Mensaje"
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            rows={2}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black resize-none"
          />
          <input
            type="text"
            placeholder="URL destino (ej: /partidos)"
            value={pushUrl}
            onChange={(e) => setPushUrl(e.target.value)}
            className="w-full bg-ceuta-bg-soft border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-black"
          />

          {/* Preview notificación */}
          {(pushTitle || pushBody) && (
            <div className="rounded-xl bg-ceuta-bg-mid border border-ceuta-border p-3">
              <div className="font-display text-[9px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">Vista previa</div>
              <div className="flex items-start gap-2.5 bg-white rounded-lg px-3 py-2.5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/escudo.webp" alt="" width={28} height={28} className="object-contain shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[12px] text-ceuta-black leading-tight truncate">
                    {pushTitle || 'Título de la notificación'}
                  </div>
                  <div className="text-[11px] text-ceuta-muted mt-0.5 line-clamp-2 leading-tight">
                    {pushBody || 'Cuerpo del mensaje…'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={sendPush}
            disabled={pushStatus === 'running' || !pushTitle.trim() || !pushBody.trim()}
            className={`w-full rounded-xl py-3 text-[13px] font-bold transition-colors disabled:opacity-50 ${
              pushStatus === 'ok' ? 'bg-[#1E9E4B] text-white' :
              pushStatus === 'error' ? 'bg-ceuta-red text-white' :
              pushEnv === 'development' ? 'bg-amber-500 text-white' :
              'bg-ceuta-black text-white'
            }`}
          >
            {pushStatus === 'running' ? '⏳ Enviando…' :
             pushStatus === 'ok' ? `✓ ${pushResult}` :
             pushStatus === 'error' ? `✗ ${pushResult}` :
             pushEnv === 'development' ? '🧪 Enviar a develop' : '🔔 Enviar a producción'}
          </button>
        </div>
      </section>}

      {/* Este dispositivo + logout */}
      {showDevice && <section>
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
      </section>}

      {/* MVP Voting */}
      {showMvp && <section><MvpAdmin /></section>}

      {/* Predicciones */}
      {showMvp && <section><PredictionAdmin /></section>}

    </div>
  )
}
