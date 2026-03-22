const CACHE_NAME = 'lumina-v2'
const STATIC_ASSETS = [
  '/feed',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('chrome-extension')
  ) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.includes('/icons/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ─── PUSH УВЕДОМЛЕНИЯ ───
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, url, type } = data

  const options = {
    body: body || '',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: url || '/notifications' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: type || 'lumina-notif',
    renotify: true,
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если приложение уже открыто — переходим
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Иначе открываем новую вкладку
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
