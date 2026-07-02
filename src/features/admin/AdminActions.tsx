'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'idle' | 'loading' | 'ok' | 'error'

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

function SyncBtn({ label, emoji, status, result, onClick }: {
  label: string; emoji: string; status: Status; result: string; onClick: () => void
}) {
  const cls = status === 'ok' ? 'admin-btn-ok' : status === 'error' ? 'admin-btn-error' : 'admin-btn-dark'
  return (
    <button onClick={onClick} disabled={status === 'loading'} className={`admin-btn ${cls} w-full`}>
      <span className="admin-btn-emoji">{status === 'loading' ? '⏳' : emoji}</span>
      <span className="admin-btn-label">{label}</span>
      {result && <span className="admin-btn-result">{result}</span>}
    </button>
  )
}

export function AdminActions() {
  const router = useRouter()

  const [syncNews, setSyncNews] = useState<Status>('idle')
  const [syncNewsResult, setSyncNewsResult] = useState('')
  const [syncMatches, setSyncMatches] = useState<Status>('idle')
  const [syncMatchesResult, setSyncMatchesResult] = useState('')

  const [customTitle, setCustomTitle] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customUrl, setCustomUrl] = useState('/')
  const [customStatus, setCustomStatus] = useState<Status>('idle')
  const [customResult, setCustomResult] = useState('')

  const [logoutLoading, setLogoutLoading] = useState(false)

  async function triggerSync(
    setStatus: (s: Status) => void,
    setResult: (s: string) => void,
    action: string,
    label: (r: unknown) => string
  ) {
    setStatus('loading')
    try {
      const result = await callTrigger(action)
      setResult(label(result))
      setStatus('ok')
    } catch (e) {
      setResult((e as Error).message)
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 5000)
  }

  async function sendCustomPush() {
    if (!customTitle.trim() || !customBody.trim()) return
    setCustomStatus('loading')
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
            emoji="📰" label="Sync noticias"
            status={syncNews} result={syncNewsResult}
            onClick={() => triggerSync(setSyncNews, setSyncNewsResult, 'news', (r: unknown) => `${(r as { newArticles?: number })?.newArticles ?? 0} nuevas`)}
          />
          <SyncBtn
            emoji="⚽" label="Sync partidos"
            status={syncMatches} result={syncMatchesResult}
            onClick={() => triggerSync(setSyncMatches, setSyncMatchesResult, 'matches', (r: unknown) => `${(r as { count?: number })?.count ?? 0} partidos`)}
          />
        </div>
      </div>

      {/* Notificación manual */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-2">Enviar notificación</p>
        <div className="bg-ceuta-bg-soft rounded-[14px] p-4 space-y-3">
          <input
            type="text"
            placeholder="Título"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
          />
          <textarea
            placeholder="Mensaje"
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            rows={2}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red resize-none"
          />
          <input
            type="text"
            placeholder="URL destino (ej: /partidos)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full bg-white border border-ceuta-border rounded-xl px-3 py-2 text-[13px] outline-none focus:border-ceuta-red"
          />
          <button
            onClick={sendCustomPush}
            disabled={customStatus === 'loading' || !customTitle.trim() || !customBody.trim()}
            className={`admin-btn ${customStatus === 'ok' ? 'admin-btn-ok' : customStatus === 'error' ? 'admin-btn-error' : 'admin-btn-dark'} w-full items-center`}
          >
            <span className="admin-btn-label text-[13px]">
              {customStatus === 'loading' ? '⏳ Enviando...'
                : customStatus === 'ok' ? `✓ ${customResult}`
                : customStatus === 'error' ? `✗ ${customResult}`
                : '🔔 Enviar a todos los suscriptores'}
            </span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="flex justify-end pt-2 border-t border-ceuta-border">
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="bg-transparent border border-ceuta-border rounded-lg px-4 py-2 text-[12px] font-semibold text-ceuta-muted cursor-pointer"
        >
          {logoutLoading ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}
