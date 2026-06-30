'use client'

import { useEffect, useState } from 'react'

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(!!sub)
      })
      .catch(() => {})
  }, [])

  const subscribe = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!('serviceWorker' in navigator)) return { ok: false, error: 'ServiceWorker no disponible' }
    if (!('PushManager' in window))
      return { ok: false, error: 'Push no soportado en este navegador' }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)
      if (perm !== 'granted') return { ok: false, error: `Permiso ${perm}` }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return { ok: false, error: 'VAPID key no configurada' }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Safari/iOS requires ArrayBuffer, not a plain base64 string
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) return { ok: false, error: `Error servidor: ${res.status}` }

      setSubscribed(true)
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Brave blocks push subscriptions when "Use Google services for push messaging" is off
      if (msg.toLowerCase().includes('push service') || msg.toLowerCase().includes('registration failed')) {
        return { ok: false, error: 'Tu navegador bloqueó el servicio de notificaciones. En Brave: Configuración → Privacidad → activa "Use Google services for push messaging"' }
      }
      return { ok: false, error: msg }
    }
  }

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
    setSubscribed(false)
  }

  return { permission, subscribed, subscribe, unsubscribe }
}
