'use client'

import Image from 'next/image'
import { useState } from 'react'
import { callTrigger, useMountedRef, type Status } from './adminActionsShared'

export function PushComposer() {
  const mountedRef = useMountedRef()

  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushUrl, setPushUrl] = useState('/')
  const [pushEnv, setPushEnv] = useState<'production' | 'development'>('production')
  const [pushStatus, setPushStatus] = useState<Status>('idle')
  const [pushResult, setPushResult] = useState('')

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

  return (
    <section>
      <div className={`bg-white rounded-[14px] border-2 p-4 space-y-3 transition-colors ${pushEnv === 'development' ? 'border-amber-300' : 'border-ceuta-border'}`}>
        {/* Toggle entorno */}
        <div className="flex gap-1 p-1 bg-ceuta-bg-soft rounded-xl">
          <button type="button"

            onClick={() => setPushEnv('production')}
            className={`flex-1 py-2 rounded-lg font-display text-[11px] font-bold tracking-[0.08em] uppercase transition-all ${
              pushEnv === 'production' ? 'bg-ceuta-black text-white shadow-sm' : 'text-ceuta-muted'
            }`}
          >
            🔔 Producción
          </button>
          <button type="button"

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
              <Image src="/escudo.webp" alt="" width={28} height={28} className="object-contain shrink-0 mt-0.5" />
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
        <button type="button"
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
    </section>
  )
}
