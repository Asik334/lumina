'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import type { User } from '@/types'

interface FollowersModalProps {
  userId: string
  type: 'подписчики' | 'подписки'
  count: number
  onClose: () => void
}

export default function FollowersModal({
  userId,
  type,
  count,
  onClose,
}: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const supabase = createClient()
    let data: User[] = []

    if (type === 'подписчики') {
      const { data: rows } = await supabase
        .from('followers')
        .select('follower:users!followers_follower_id_fkey(*)')
        .eq('following_id', userId)
        .limit(50)

      data = rows?.map((r: any) => r.follower).filter(Boolean) || []
    } else {
      const { data: rows } = await supabase
        .from('followers')
        .select('following:users!followers_following_id_fkey(*)')
        .eq('follower_id', userId)
        .limit(50)

      data = rows?.map((r: any) => r.following).filter(Boolean) || []
    }

    setUsers(data)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm glass rounded-2xl border border-white/10 overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="font-semibold capitalize">
              {type} ({count})
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No {type} yet
              </div>
            ) : (
              <div className="p-2">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <UserAvatar user={user} size="md" />
                    <div>
                      <p className="font-semibold text-sm">{user.username}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground">{user.full_name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}