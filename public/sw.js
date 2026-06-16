self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const title = data.title ?? 'AD Ceuta FC'
  const options = {
    body: data.body ?? '',
    icon: '/icon-512.png',
    badge: '/escudo.png',
    tag: data.tag ?? 'adceuta',
    renotify: true,
    data: { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          return client.navigate(targetUrl)
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
