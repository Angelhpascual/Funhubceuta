self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const title = data.title ?? 'AD Ceuta FC'
  const options = {
    body: data.body ?? '',
    icon: '/escudo.png',
    badge: '/escudo.png',
    tag: data.tag ?? 'adceuta',
    renotify: true,
    data: { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
