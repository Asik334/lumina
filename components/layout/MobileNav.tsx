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

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10,10,20,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          <Link
            href="/feed"
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${pathname === '/feed' ? 'text-white' : 'text-white/40'}`}
          >
            <Home className={`w-6 h-6 ${pathname === '/feed' ? 'fill-white' : ''}`} />
          </Link>

          <Link
            href="/search"
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${pathname === '/search' ? 'text-white' : 'text-white/40'}`}
          >
            <Search className="w-6 h-6" />
          </Link>

          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-lg transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
          >
            <PlusSquare className="w-6 h-6" />
          </button>

          <Link
            href="/notifications"
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${pathname === '/notifications' ? 'text-white' : 'text-white/40'}`}
          >
            <Heart className={`w-6 h-6 ${pathname === '/notifications' ? 'fill-white' : ''}`} />
          </Link>

          {user ? (
            <Link
              href={`/profile/${user.username}`}
              className={`p-1 rounded-xl transition-all ${pathname.startsWith('/profile') ? 'ring-2 ring-purple-500 rounded-full' : 'opacity-50'}`}
            >
              <UserAvatar user={user} size="sm" />
            </Link>
          ) : (
            <Link
              href="/feed"
              className="p-2 rounded-xl text-white/40"
            >
              <User className="w-6 h-6" />
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
