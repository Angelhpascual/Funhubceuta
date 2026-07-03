'use client'

import { useState, useRef, useCallback } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'

type Status = 'idle' | 'queued' | 'ok' | 'error'

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

  const pollUntilDone = useCallback(
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
        } catch {
          // ignore, keep polling
        }
      }, 2500)
    },
    []
  )

  return pollUntilDone
}

function formatLogResult(log: CronLog): string {
  const d = log.details
  if (log.status !== 'success') return `✗ ${(d.error as string) ?? 'Error'}`
  const parts: string[] = []
  if (typeof d.newArticles === 'number') parts.push(`${d.newArticles} nuevas`)
  if (typeof d.optimizedNewImages === 'number' && d.optimizedNewImages > 0) parts.push(`${d.optimizedNewImages} fotos`)
  if (typeof d.count === 'number') parts.push(`${d.count} partidos`)
  if (typeof d.updated === 'number') parts.push(`${d.updated} jugadores`)
  if (typeof d.total === 'number') parts.push(`${d.total} escudos`)
  if ((d.imageErrors as unknown[])?.length) parts.push(`⚠️ ${(d.imageErrors as unknown[]).length} fotos fallidas`)
  return parts.length > 0 ? parts.join(' · ') : 'OK'
}

type SyncState = { status: Status; result: string; elapsed: number }

function SyncBtn({ label, emoji, state, onClick }: {
  label: string; emoji: string; state: SyncState; onClick: () => void
}) {
  const { status, result, elapsed } = state
  const busy = status === 'queued'
  const cls = status === 'ok' ? 'admin-btn-ok' : status === 'error' ? 'admin-btn-error' : 'admin-btn-dark'

  return (
    <div className="flex flex-col gap-1">
      <button onClick={onClick} disabled={busy} className={`admin-btn ${cls} w-full`}>
        <span className="admin-btn-emoji">{busy ? '⏳' : emoji}</span>
        <span className="admin-btn-label">
          {busy ? 'Ejecutando...' : label}
        </span>
        {result && !busy && <span className="admin-btn-result">{result}</span>}
      </button>
      {busy && (
        <div className="px-1 space-y-1">
          <div className="w-full h-1 bg-ceuta-border rounded-full overflow-hidden">
            <div className="h-full bg-ceuta-red rounded-full animate-pulse" style={{ width: `${Math.min(95, (elapsed / 60) * 100)}%`, transition: 'width 2.5s linear' }} />
          </div>
          <p className="text-[9px] text-ceuta-muted">{elapsed}s · En ejecución en servidor…</p>
        </div>
      )}
    </div>
  )
}

const IDLE: SyncState = { status: 'idle', result: '', elapsed: 0 }

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

  const [deviceStatus, setDeviceStatus] = useState<'idle' | 'queued' | 'ok' | 'error' | 'unsupported'>('idle')
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
    cronType: string
  ) {
    set({ status: 'queued', result: '', elapsed: 0 })
    startElapsed(set)
    const since = Date.now()
    try {
      await callTrigger(action)
    } catch (e) {
      stopElapsed()
      set({ status: 'error', result: (e as Error).message, elapsed: 0 })
      setTimeout(() => set(IDLE), 6000)
      return
    }

    poll(
      cronType,
      since,
      (log) => {
        stopElapsed()
        const result = formatLogResult(log)
        const status = log.status === 'success' && !(log.details.imageErrors as unknown[])?.length ? 'ok' : 'error'
        set({ status, result, elapsed: 0 })
        setTimeout(() => set(IDLE), 8000)
      },
      () => {
        stopElapsed()
        set({ status: 'error', result: 'Sin respuesta del servidor', elapsed: 0 })
        setTimeout(() => set(IDLE), 6000)
      }
    )
  }

  async function sendCustomPush() {
    if (!customTitle.trim() || !customBody.trim()) return
    setCustomStatus('queued')
    try {
      const result = await callTrigger('push', {
        title: customTitle, body: customBody, tag: 'custom', url: customUrl || '/',
      })
      setCustomResult(`${result?.sent ?? 0} enviadas`)
      setCustomStatus('ok')
      setCustomTitle('')
      setCustomBody('')
      setCustomUrl('/')
    } catch (e) {
      setCustomResult((e as Error).message)
      setCustomStatus('error')
    }
    setTimeout(() => setCustomStatus('idle'), 5000)
  }

  async function registerDevice() {
    setDeviceStatus('queued')
    setDeviceMsg('')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setDeviceStatus('unsupported'); setDeviceMsg('Push no disponible en este navegador'); return
      }
      await navigator.serviceWorker.register('/sw.js')
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 8000)),
      ])
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setDeviceStatus('error'); setDeviceMsg('Permiso denegado'); return
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) { setDeviceStatus('error'); setDeviceMsg('Falta VAPID key'); return }
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey })
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      }
      const res = await fetch('/api/admin/register-device', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      if (res.ok) { setDeviceStatus('ok'); setDeviceMsg('Dispositivo registrado') }
      else { setDeviceStatus('error'); setDeviceMsg('Error al registrar') }
    } catch (e) {
      setDeviceStatus('error'); setDeviceMsg((e as Error).message ?? 'Error desconocido')
    }
    setTimeout(() => setDeviceStatus('idle'), 5000)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  return (
    <div className="space-y-5">
      {/* Sync */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-2">Sincronizar datos</p>
        <div className="grid grid-cols-2 gap-2">
          <SyncBtn
            emoji="📰" label="Sync noticias" state={syncNews}
            onClick={() => triggerSync(setSyncNews, 'news', 'news')}
          />
          <SyncBtn
            emoji="⚽" label="Sync partidos" state={syncMatches}
            onClick={() => triggerSync(setSyncMatches, 'matches', 'matches')}
          />
          <SyncBtn
            emoji="🛡️" label="Sync escudos" state={IDLE}
            onClick={() => triggerSync(setSyncNews, 'sync-logos', 'sync-logos')}
          />
          <SyncBtn
            emoji="🖼️" label="Sync fotos" state={syncImages}
            onClick={() => triggerSync(setSyncImages, 'backfill-images', 'backfill-images')}
          />
        </div>
      </div>

      {/* Notificación manual */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-2">Enviar notificación</p>
        <div className="bg-ceuta-bg-soft rounded-[14px] p-4 space-y-3">
          <input
            type="text" placeholder="Título" value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
          />
          <textarea
            placeholder="Mensaje" value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            rows={2}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red resize-none"
          />
          <input
            type="text" placeholder="URL destino (ej: /partidos)" value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
          />
          <button
            onClick={sendCustomPush}
            disabled={customStatus === 'queued' || !customTitle.trim() || !customBody.trim()}
            className={`admin-btn ${customStatus === 'ok' ? 'admin-btn-ok' : customStatus === 'error' ? 'admin-btn-error' : 'admin-btn-dark'} w-full items-center`}
          >
            <span className="admin-btn-label text-[13px]">
              {customStatus === 'queued' ? '⏳ Enviando...'
                : customStatus === 'ok' ? `✓ ${customResult}`
                : customStatus === 'error' ? `✗ ${customResult}`
                : '🔔 Enviar a todos los suscriptores'}
            </span>
          </button>
        </div>
      </div>

      {/* Registrar dispositivo */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-2">Este dispositivo</p>
        <button
          onClick={registerDevice} disabled={deviceStatus === 'queued'}
          className={`admin-btn ${deviceStatus === 'ok' ? 'admin-btn-ok' : deviceStatus === 'error' || deviceStatus === 'unsupported' ? 'admin-btn-error' : 'admin-btn-dark'} w-full`}
        >
          <span className="admin-btn-emoji">📲</span>
          <span className="admin-btn-label">
            {deviceStatus === 'queued' ? '⏳ Registrando...' :
             deviceStatus === 'ok' ? `✓ ${deviceMsg}` :
             deviceStatus === 'error' || deviceStatus === 'unsupported' ? `✗ ${deviceMsg}` :
             'Recibir alertas en este dispositivo'}
          </span>
        </button>
      </div>

      {/* Logout */}
      <div className="flex justify-end pt-2 border-t border-ceuta-border">
        <button
          onClick={handleLogout} disabled={logoutLoading}
          className="bg-transparent border border-ceuta-border rounded-lg px-4 py-2 text-[12px] font-semibold text-ceuta-muted cursor-pointer"
        >
          {logoutLoading ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}
