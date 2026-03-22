'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function PushToggle() {
  const { permission, subscribed, loading, isSupported, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) return null

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/10">
        <BellOff className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Уведомления заблокированы</p>
          <p className="text-xs text-muted-foreground">Разрешите в настройках браузера</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 glass rounded-xl border transition-all active:scale-98 ${
        subscribed
          ? 'border-purple-500/30 bg-purple-500/10'
          : 'border-white/10 hover:bg-white/5'
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground flex-shrink-0" />
      ) : subscribed ? (
        <Bell className="w-5 h-5 text-purple-400 flex-shrink-0" />
      ) : (
        <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium">
          {subscribed ? 'Push уведомления включены' : 'Включить Push уведомления'}
        </p>
        <p className="text-xs text-muted-foreground">
          {subscribed ? 'Вы получаете уведомления о лайках, комментариях и подписках' : 'Узнавайте о новых лайках и сообщениях'}
        </p>
      </div>
      {/* Тоггл */}
      <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${subscribed ? 'bg-purple-500' : 'bg-white/20'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${subscribed ? 'left-6' : 'left-1'}`} />
      </div>
    </button>
  )
}
