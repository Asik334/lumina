'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react'
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
    { href: '/feed', icon: Home, label: 'Главная' },
    { href: '/search', icon: Search, label: 'Поиск' },
    { href: '/notifications', icon: Heart, label: 'Активность' },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-40 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.slice(0, 2).map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`p-2 rounded-xl transition-colors ${
                pathname === href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${pathname === href ? 'fill-current' : ''}`} />
            </Link>
          ))}

          {/* Create */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="p-2 rounded-xl text-muted-foreground"
          >
            <PlusSquare className="w-6 h-6" />
          </button>

          {navItems.slice(2).map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`p-2 rounded-xl transition-colors ${
                pathname === href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${pathname === href ? 'fill-current' : ''}`} />
            </Link>
          ))}

          {user && (
            <Link
              href={`/profile/${user.username}`}
              className="p-1 rounded-xl"
            >
              <UserAvatar user={user} size="sm" />
            </Link>
          )}
        </div>
      </nav>

      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}
    </>
  )
}
