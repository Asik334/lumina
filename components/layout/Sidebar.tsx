'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home, Search, Compass, Film, MessageCircle,
  Heart, PlusSquare, User, LogOut, Zap, ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'
import CreatePostModal from '@/components/posts/CreatePostModal'
import { useState } from 'react'

interface SidebarProps {
  user: UserType | null
  isAdmin?: boolean
}

export default function Sidebar({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showCreatePost, setShowCreatePost] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/feed', icon: Home, label: 'Главная' },
    { href: '/search', icon: Search, label: 'Поиск' },
    { href: '/explore', icon: Compass, label: 'Обзор' },
    { href: '/stories', icon: Film, label: 'Истории' },
    { href: '/messages', icon: MessageCircle, label: 'Сообщения' },
    { href: '/notifications', icon: Heart, label: 'Уведомления' },
  ]

  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 xl:w-72 glass border-r border-white/5 z-40 p-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 px-3 py-4 mb-4">
          <div className="w-8 h-8 rounded-lg bg-neon-gradient flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold neon-text">Lumina</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-neon-purple' : ''}`} />
                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-purple"
                  />
                )}
              </Link>
            )
          })}

          {/* Create Post */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-200 group"
          >
            <PlusSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Создать пост</span>
          </button>

          {/* Profile */}
          {user && (
            <Link
              href={`/profile/${user.username}`}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                pathname.startsWith('/profile') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <UserAvatar user={user} size="sm" />
              <span className="font-medium">Профиль</span>
            </Link>
          )}

          {/* Admin panel */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                pathname.startsWith('/admin') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 transition-transform group-hover:scale-110 ${pathname.startsWith('/admin') ? 'text-neon-purple' : ''}`} />
              <span className="font-medium">Админка</span>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group mt-2"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="font-medium">Выйти</span>
        </button>
      </aside>

      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </>
  )
}
