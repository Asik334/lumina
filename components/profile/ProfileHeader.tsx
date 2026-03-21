'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Settings, Grid, Film, Bookmark, Link as LinkIcon } from 'lucide-react'
import type { User } from '@/types'
import { formatCount } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import Link from 'next/link'

interface ProfileHeaderProps {
  profile: User
  isOwnProfile: boolean
  isFollowing: boolean
  currentUserId: string
  postsCount: number
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing: initialFollowing,
  currentUserId,
  postsCount,
}: ProfileHeaderProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(profile.followers_count)
  const [loading, setLoading] = useState(false)

  const handleFollow = async () => {
    if (loading) return
    setLoading(true)
    const supabase = createClient()

    if (following) {
      await supabase.from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id)
      setFollowing(false)
      setFollowersCount(c => c - 1)
    } else {
      await supabase.from('followers')
        .insert({ follower_id: currentUserId, following_id: profile.id })
      setFollowing(true)
      setFollowersCount(c => c + 1)
    }
    setLoading(false)
  }

  return (
    <div className="mb-8">
      <div className="flex gap-8 md:gap-16 items-start mb-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <UserAvatar user={profile} size="xl" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-xl font-semibold">{profile.username}</h1>

            {isOwnProfile ? (
              <div className="flex gap-2">
                <Link
                  href="/profile/edit"
                  className="px-4 py-1.5 text-sm font-semibold glass rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                >
                  Edit profile
                </Link>
                <button className="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  disabled={loading}
                  className={`px-6 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    following
                      ? 'glass border border-white/10 hover:bg-white/10'
                      : 'bg-neon-gradient hover:opacity-90'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </motion.button>
                <Link
                  href={`/messages?user=${profile.id}`}
                  className="px-4 py-1.5 text-sm font-semibold glass rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                >
                  Message
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-4">
            {[
              { label: 'posts', value: postsCount },
              { label: 'followers', value: followersCount },
              { label: 'following', value: profile.following_count },
            ].map(({ label, value }) => (
              <div key={label} className="text-center md:text-left">
                <span className="font-bold text-sm">{formatCount(value)}</span>
                <span className="text-muted-foreground text-sm ml-1">{label}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          <div className="space-y-1">
            {profile.full_name && (
              <p className="font-semibold text-sm">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neon-blue flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <LinkIcon className="w-3 h-3" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-white/10">
        {[
          { icon: Grid, label: 'Posts' },
          { icon: Film, label: 'Reels' },
          { icon: Bookmark, label: 'Saved', own: true },
        ].map(({ icon: Icon, label, own }) => (
          (!own || isOwnProfile) && (
            <button
              key={label}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors border-t-2 border-transparent hover:border-foreground/30"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          )
        ))}
      </div>
    </div>
  )
}
