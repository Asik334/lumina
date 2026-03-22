'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PushToggle from '@/components/ui/PushToggle'
import Link from 'next/link'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'
import { Bell, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(*), post:posts!post_id(id, image_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setError(error.message)
    } else {
      setNotifications(data || [])
      if (data && data.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select('*, actor:users!notifications_actor_id_fkey(*), post:posts!post_id(id, image_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setNotifications((prev) => [data, ...prev])
            await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', data.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getNotifConfig = (type: string) => {
    switch (type) {
      case 'like':    return { text: 'оценил(а) вашу публикацию',      icon: Heart,         color: 'text-red-400' }
      case 'comment': return { text: 'прокомментировал(а) публикацию', icon: MessageCircle, color: 'text-blue-400' }
      case 'follow':  return { text: 'подписался(ась) на вас',         icon: UserPlus,      color: 'text-green-400' }
      case 'mention': return { text: 'упомянул(а) вас',                icon: AtSign,        color: 'text-purple-400' }
      case 'reply':   return { text: 'ответил(а) на комментарий',      icon: MessageCircle, color: 'text-cyan-400' }
      default:        return { text: 'взаимодействовал(а) с вами',     icon: Bell,          color: 'text-gray-400' }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Уведомления</h1>
      </div>

      <div className="px-4 mb-4 sm:px-0">
        <PushToggle />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">Не удалось загрузить уведомления</p>
          <p className="text-xs text-red-400 mt-2 font-mono">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">Уведомлений пока нет</p>
          <p className="text-sm text-muted-foreground">Когда кто-то лайкнет или прокомментирует — вы увидите здесь.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(notif => {
            const config = getNotifConfig(notif.type)
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  !notif.is_read ? 'bg-white/5 border border-white/10' : 'hover:bg-white/3'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {notif.actor ? (
                    <Link href={`/profile/${notif.actor.username}`}>
                      <UserAvatar user={notif.actor} size="md" />
                    </Link>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-white/10">
                    <Icon className={`w-3 h-3 ${config.color}`} />
                  </div>
                </div>
                <p className="flex-1 text-sm">
                  {notif.actor ? (
                    <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:opacity-80">
                      {notif.actor.username}
                    </Link>
                  ) : <span className="font-semibold">Кто-то</span>}{' '}
                  <span className="text-muted-foreground">{config.text}</span>{' '}
                  <span className="text-muted-foreground text-xs">{formatTimeAgo(notif.created_at)}</span>
                </p>
                {notif.post?.image_url && (
                  <Link href={`/posts/${notif.post_id}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                      <img src={notif.post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                )}
                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
