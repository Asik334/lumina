import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendPush(
  targetUserId: string,
  title: string,
  body: string,
  icon?: string | null
) {
  try {
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)

    if (!subscriptions || subscriptions.length === 0) return

    const webpush = await import('web-push')
    webpush.default.setVapidDetails(
      'mailto:admin@lumina.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const payload = JSON.stringify({
      title,
      body,
      url: '/notifications',
      icon: icon || '/icons/icon-192x192.png',
    })

    const toDelete: string[] = []
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.default.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            toDelete.push(sub.id)
          }
        }
      })
    )

    if (toDelete.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', toDelete)
    }
  } catch (err) {
    console.error('Push error:', err)
  }
}
