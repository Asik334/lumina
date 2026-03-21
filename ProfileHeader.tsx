'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Grid, Film, Bookmark, Link as LinkIcon, Loader2, MessageCircle } from 'lucide-react'
import type { User } from '@/types'
import { formatCount } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import Link from 'next/link'
import FollowersModal from '@/components/profile/FollowersModal'

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
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(profile.followers_count)
  const [followLoading, setFollowLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null)

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
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
    setFollowLoading(false)
  }

  // Кнопка "Написать" — создаёт или открывает беседу и переходит в чат
  const handleMessage = async () => {
    if (messageLoading) return
    setMessageLoading(true)
    const supabase = createClient()

    // Проверяем есть ли уже беседа
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1.eq.${currentUserId},participant_2.eq.${profile.id}),` +
        `and(participant_1.eq.${profile.id},participant_2.eq.${currentUserId})`
      )
      .maybeSingle()

    if (!existing) {
      // Создаём новую беседу
      await supabase
        .from('conversations')
        .insert({ participant_1: currentUserId, participant_2: profile.id })
    }

    setMessageLoading(false)
    router.push('/messages')
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex gap-8 md:gap-16 items-start mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <UserAvatar user={profile} size="xl" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className="text-xl font-semibold">{profile.username}</h1>
              {profile.is_verified && (
                <svg className="w-5 h-5 text-neon-blue flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="px-4 py-1.5 text-sm font-semibold glass rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Редактировать профиль
                  </Link>
                  <button className="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                      following
                        ? 'glass border border-white/10 hover:bg-white/10'
                        : 'bg-neon-gradient hover:opacity-90'
                    }`}
                  >
                    {followLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    {following ? 'Подписан' : 'Подписаться'}
                  </motion.button>

                  {/* Кнопка Написать — открывает чат */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="px-4 py-1.5 text-sm font-semibold glass rounded-lg hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    {messageLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <MessageCircle className="w-3.5 h-3.5" />
                    }
                    Написать
                  </motion.button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div className="cursor-default">
                <span className="font-bold text-sm">{formatCount(postsCount)}</span>
                <span className="text-muted-foreground text-sm ml-1">публикаций</span>
              </div>
              <button
                onClick={() => setShowModal('followers')}
                className="hover:opacity-70 transition-opacity"
              >
                <span className="font-bold text-sm">{formatCount(followersCount)}</span>
                <span className="text-muted-foreground text-sm ml-1">подписчиков</span>
              </button>
              <button
                onClick={() => setShowModal('following')}
                className="hover:opacity-70 transition-opacity"
              >
                <span className="font-bold text-sm">{formatCount(profile.following_count)}</span>
                <span className="text-muted-foreground text-sm ml-1">подписок</span>
              </button>
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
            { icon: Grid, label: 'Публикации' },
            { icon: Film, label: 'Видео' },
            ...(isOwnProfile ? [{ icon: Bookmark, label: 'Сохранённые' }] : []),
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors border-t-2 border-transparent hover:border-foreground/30"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Followers / Following modal */}
      {showModal && (
        <FollowersModal
          userId={profile.id}
          type={showModal}
          count={showModal === 'followers' ? followersCount : profile.following_count}
          onClose={() => setShowModal(null)}
        />
      )}
    </>
  )
}
