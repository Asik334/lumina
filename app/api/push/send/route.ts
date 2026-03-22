import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!

// Отправка push через Web Push Protocol
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
) {
  const { endpoint, p256dh, auth } = subscription

  // Импортируем web-push динамически
  const webpush = await import('web-push')
  webpush.default.setVapidDetails(
    'mailto:admin@lumina.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )

  await webpush.default.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify(payload)
  )
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId, title, body, url, type } = await request.json()
  if (!targetUserId || !title) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Получаем подписки целевого пользователя
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', targetUserId)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const payload = { title, body, url: url || '/notifications', type, icon: '/icons/icon-192x192.png' }

  let sent = 0
  const toDelete: string[] = []

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await sendPushNotification(sub, payload)
      sent++
    } catch (err: any) {
      // Если подписка истекла — удаляем
      if (err.statusCode === 410 || err.statusCode === 404) {
        toDelete.push(sub.id)
      }
    }
  }))

  // Удаляем истёкшие подписки
  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }

  return NextResponse.json({ success: true, sent })
}
