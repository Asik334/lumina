import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'
import { Bell } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, actor:users!notifications_actor_id_fkey(*), post:posts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Помечаем все как прочитанные
  if (notifications && notifications.length > 0) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  const getNotifText = (type: string) => {
    switch (type) {
      case 'like': return 'оценил(а) вашу публикацию'
      case 'comment': return 'прокомментировал(а) вашу публикацию'
      case 'follow': return 'подписался(ась) на вас'
      case 'mention': return 'упомянул(а) вас в комментарии'
      case 'reply': return 'ответил(а) на ваш комментарий'
      default: return 'взаимодействовал(а) с вами'
    }
  }

  const hasError = error || !notifications

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Уведомления</h1>

      {hasError ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">Не удалось загрузить уведомления</p>
          <p className="text-sm text-muted-foreground">Попробуйте обновить страницу</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">Уведомлений пока нет</p>
          <p className="text-sm text-muted-foreground">
            Когда кто-то оценит или прокомментирует ваши публикации — вы увидите это здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                !notif.is_read ? 'bg-white/5' : 'hover:bg-white/3'
              }`}
            >
              {notif.actor ? (
                <Link href={`/profile/${notif.actor?.username}`}>
                  <UserAvatar user={notif.actor} size="md" />
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <p className="flex-1 text-sm">
                {notif.actor ? (
                  <Link href={`/profile/${notif.actor?.username}`} className="font-semibold hover:opacity-80">
                    {notif.actor?.username}
                  </Link>
                ) : (
                  <span className="font-semibold">Кто-то</span>
                )}{' '}
                {getNotifText(notif.type)}{' '}
                <span className="text-muted-foreground">{formatTimeAgo(notif.created_at)}</span>
              </p>
              {notif.post?.image_url && (
                <Link href={`/posts/${notif.post_id}`} className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                    <img
                      src={notif.post.image_url}
                      alt="публикация"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
