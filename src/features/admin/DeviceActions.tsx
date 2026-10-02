'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMountedRef } from './adminActionsShared'

export function DeviceActions() {
  const router = useRouter()
  const mountedRef = useMountedRef()

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<'idle' | 'running' | 'ok' | 'error' | 'unsupported'>('idle')
  const [deviceMsg, setDeviceMsg] = useState('')

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

  return (
    <section>
      <div className="space-y-2">
        <button type="button"
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

        <button type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full rounded-[14px] border-2 border-ceuta-border bg-white p-4 text-left text-[14px] font-bold text-ceuta-muted disabled:opacity-50 transition-colors hover:border-ceuta-red hover:text-ceuta-red"
        >
          {logoutLoading ? '⏳ Saliendo…' : '← Cerrar sesión'}
        </button>
      </div>
    </section>
  )
}
