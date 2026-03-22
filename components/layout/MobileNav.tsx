'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Compass, MessageCircle, Heart, PlusSquare } from 'lucide-react'
import type { User as UserType } from '@/types'
import { useState } from 'react'
import CreatePostModal from '@/components/posts/CreatePostModal'
import UserAvatar from '@/components/ui/UserAvatar'

interface MobileNavProps {
  user: UserType | null
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const [showCreatePost, setShowCreatePost] = useState(false)

  const navItems = [
    { href: '/feed',          icon: Home,          label: 'Главная' },
    { href: '/search',        icon: Search,        label: 'Поиск' },
    { href: '/explore',       icon: Compass,       label: 'Обзор' },
    { href: '/messages',      icon: MessageCircle, label: 'Сообщения' },
    { href: '/notifications', icon: Heart,         label: 'Активность' },
  ]

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(8,8,16,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/feed' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90"
              >
                <Icon className={`w-6 h-6 transition-all ${active ? 'text-white' : 'text-white/35'}`}
                  style={active ? { filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.7))' } : {}} />
                <span className={`text-[10px] ${active ? 'text-white' : 'text-white/30'}`}>{label}</span>
              </Link>
            )
          })}

          {/* Кнопка создать пост — по центру */}
          <button
            onClick={() => setShowCreatePost(true)}
            aria-label="Создать публикацию"
            className="flex items-center justify-center w-13 h-13 rounded-2xl shadow-lg transition-all active:scale-90"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              width: 52, height: 52,
              boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
            }}
          >
            <PlusSquare className="w-6 h-6 text-white" />
          </button>

          {navItems.slice(2, 4).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/feed' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90"
              >
                <Icon className={`w-6 h-6 transition-all ${active ? 'text-white' : 'text-white/35'}`}
                  style={active ? { filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.7))' } : {}} />
                <span className={`text-[10px] ${active ? 'text-white' : 'text-white/30'}`}>{label}</span>
              </Link>
            )
          })}

          {/* Аватар — профиль */}
          {user ? (
            <Link
              href={`/profile/${user.username}`}
              aria-label="Профиль"
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90"
            >
              <div className={`rounded-full transition-all ${pathname.startsWith('/profile') ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-black' : 'opacity-40'}`}>
                <UserAvatar user={user} size="sm" />
              </div>
              <span className={`text-[10px] ${pathname.startsWith('/profile') ? 'text-white' : 'text-white/30'}`}>Профиль</span>
            </Link>
          ) : (
            <Link href="/feed" aria-label="Профиль" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-white/10" />
              <span className="text-[10px] text-white/30">Профиль</span>
            </Link>
          )}
        </div>
      </nav>

      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}
    </>
  )
}
