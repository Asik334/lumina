'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'

interface SuggestedUsersProps {
  currentUser: User
  suggestedUsers: User[]
  currentUserId: string
}

export default function SuggestedUsers({ currentUser, suggestedUsers, currentUserId }: SuggestedUsersProps) {
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const handleFollow = async (userId: string) => {
    const supabase = createClient()
    const isFollowing = following.has(userId)

    if (isFollowing) {
      await supabase.from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
      setFollowing(prev => { const n = new Set(prev); n.delete(userId); return n })
    } else {
      await supabase.from('followers')
        .insert({ follower_id: currentUserId, following_id: userId })
      setFollowing(prev => new Set([...prev, userId]))
    }
  }

  return (
    <div className="sticky top-6">
      {/* Current user */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/profile/${currentUser.username}`}>
          <UserAvatar user={currentUser} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${currentUser.username}`} className="font-semibold text-sm hover:opacity-80 transition-opacity block truncate">
            {currentUser.username}
          </Link>
          <p className="text-xs text-muted-foreground truncate">{currentUser.full_name || 'Имя не указано'}</p>
        </div>
        <button className="text-xs text-neon-blue font-semibold hover:opacity-80 transition-opacity">
          Switch
        </button>
      </div>

      {/* Suggestions */}
      {suggestedUsers.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested for you</span>
            <Link href="/explore" className="text-xs font-semibold hover:opacity-80 transition-opacity">
              See all
            </Link>
          </div>

          <div className="space-y-3">
            {suggestedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <UserAvatar user={user} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.username}`} className="font-semibold text-xs hover:opacity-80 block truncate">
                    {user.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">Suggested for you</p>
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
                  className={`text-xs font-semibold transition-colors ${
                    following.has(user.id)
                      ? 'text-muted-foreground'
                      : 'text-neon-blue hover:opacity-80'
                  }`}
                >
                  {following.has(user.id) ? 'Подписан' : 'Подписаться'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground mt-8">
        © 2025 Lumina
      </p>
    </div>
  )
}
