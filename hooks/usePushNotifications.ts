'use client'

import { useState, useEffect } from 'react'

// Хардкод ключа как fallback — Next.js подставит переменную на этапе сборки
const VAPID_PUBLIC_KEY: string =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BFKHq-iXmhE3LfAyP5UVxr6BSDtx_jHYeeNgZNDs3lpKe4kSGbzmn0GwlQZgfH_pKHZ95jIrIoF3F2IRzYyxb74'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Гарантируем регистрацию SW и возвращаем registration
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker не поддерживается')
  }
  // Регистрируем SW если ещё не зарегистрирован
  await navigator.serviceWorker.register('/sw.js')
  // Ждём готовности
  return navigator.serviceWorker.ready
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await getServiceWorkerRegistration()
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {
      setSubscribed(false)
    }
  }

  const subscribe = async () => {
    if (loading) return
    setLoading(true)

    try {
      // Запрашиваем разрешение
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      // Получаем registration (с гарантированной регистрацией SW)
      const reg = await getServiceWorkerRegistration()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Сохраняем на сервере
      const subJson = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
        }),
      })

      if (!res.ok) throw new Error('Ошибка сохранения подписки на сервере')

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (loading) return
    setLoading(true)

    try {
      const reg = await getServiceWorkerRegistration()
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })

      await sub.unsubscribe()
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  return { permission, subscribed, loading, isSupported, subscribe, unsubscribe }
}
