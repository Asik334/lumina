'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import type { User as UserType } from '@/types'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MobileHeaderProps {
  user: UserType | null
}

export default function MobileHeader({ user }: MobileHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
      style={{
        background: 'rgba(8,8,16,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Lumina
        </span>
      </Link>

      {/* Right side — bell */}
      <Link href="/notifications" className="relative p-2">
        <Bell className="w-6 h-6 text-white/80" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              boxShadow: '0 0 8px rgba(168,85,247,0.6)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  )
}
