import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
) {
  const webpush = await import('web-push')
  webpush.default.setVapidDetails(
    'mailto:admin@lumina.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
  await webpush.default.sendNotification(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    JSON.stringify(payload)
  )
}

export async function POST(request: NextRequest) {
  // Используем service role — не требует сессии
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { targetUserId, title, body, url, type } = await request.json()
  if (!targetUserId || !title) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

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
      if (err.statusCode === 410 || err.statusCode === 404) {
        toDelete.push(sub.id)
      }
    }
  }))

  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }

  return NextResponse.json({ success: true, sent })
}