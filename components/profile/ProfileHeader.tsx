'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings, Grid, Film, Bookmark, Link as LinkIcon,
  Loader2, MessageCircle, BadgeCheck, Share2, Music, Ban, Circle
} from 'lucide-react'
import type { User } from '@/types'
import { formatCount } from '@/lib/utils'
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
  const [showModal, setShowModal] = useState<'подписчики' | 'подписки' | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  // Update own online status
  useEffect(() => {
    if (!isOwnProfile) return
    const updateOnline = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('users').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', currentUserId)
    }
    updateOnline()
    const interval = setInterval(updateOnline, 30000)
    const handleUnload = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('users').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', currentUserId)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', handleUnload) }
  }, [isOwnProfile, currentUserId])

  // Check block status
  useEffect(() => {
    if (isOwnProfile) return
    const checkBlock = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('blocks').select('id')
        .eq('blocker_id', currentUserId).eq('blocked_id', profile.id)
        .maybeSingle()
      setIsBlocked(!!data)
    }
    checkBlock()
  }, [isOwnProfile, currentUserId, profile.id])

  const handleFollow = async () => {
    if (followLoading) return
    setFollowLoading(true)
    if (following) {
      await fetch(`/api/followers?followingId=${profile.id}`, { method: 'DELETE' })
      setFollowing(false)
      setFollowersCount(c => c - 1)
    } else {
      await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: profile.id }),
      })
      setFollowing(true)
      setFollowersCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  const handleMessage = async () => {
    if (messageLoading) return
    setMessageLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${currentUserId})`)
      .maybeSingle()
    if (!existing) {
      await supabase.from('conversations').insert({ participant_1: currentUserId, participant_2: profile.id })
    }
    setMessageLoading(false)
    router.push('/messages')
  }

  const handleBlock = async () => {
    if (blockLoading) return
    setBlockLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', profile.id)
      setIsBlocked(false)
    } else {
      await supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: profile.id })
      setIsBlocked(true)
      if (following) {
        await fetch(`/api/followers?followingId=${profile.id}`, { method: 'DELETE' })
        setFollowing(false)
        setFollowersCount(c => c - 1)
      }
    }
    setBlockLoading(false)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${profile.username}`
    if (navigator.share) {
      navigator.share({ title: `${profile.username} в Lumina`, url })
    } else {
      navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    }
  }

  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return ''
    const diff = Date.now() - new Date(lastSeen).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч назад`
    return `${Math.floor(hours / 24)} дн назад`
  }

  const tabs = [
    { key: 'posts', icon: Grid, label: 'POSTS' },
    { key: 'reels', icon: Film, label: 'REELS' },
    ...(isOwnProfile ? [{ key: 'saved', icon: Bookmark, label: 'SAVED' }] : []),
  ]

  return (
    <>
      {shareToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}>
          ✓ Ссылка скопирована
        </motion.div>
      )}

      <div className="w-full">
        {/* Banner */}
        <div className="w-full h-28 md:h-36 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 40%, #1a0533 100%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(168,85,247,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(236,72,153,0.3) 0%, transparent 60%)' }} />
        </div>

        <div className="px-4 relative">
          {/* Avatar + buttons */}
          <div className="flex items-end justify-between" style={{ marginTop: -44 }}>
            <div className="relative">
              <div className="rounded-full p-[3px]"
                style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
                <div className="rounded-full p-[2px] bg-[#0a0a0f]">
                  <UserAvatar user={profile} size="xl" />
                </div>
              </div>
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0f] ${profile.is_online ? 'bg-green-500' : 'bg-gray-600'}`} />
            </div>

            <div className="flex gap-2 mb-1 flex-wrap justify-end">
              {isOwnProfile ? (
                <>
                  <Link href="/profile/edit"
                    className="px-4 py-1.5 text-sm font-semibold rounded-xl border border-white/15 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Edit profile
                  </Link>
                  <button onClick={handleShare}
                    className="p-2 rounded-xl border border-white/15 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Share2 className="w-4 h-4" />
                  </button>
                  <Link href="/profile/edit"
                    className="p-2 rounded-xl border border-white/15 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Settings className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleFollow} disabled={followLoading}
                    className={`px-5 py-1.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${following ? 'border border-white/15' : 'text-white'}`}
                    style={following
                      ? { background: 'rgba(255,255,255,0.05)' }
                      : { background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 4px 15px rgba(168,85,247,0.4)' }}>
                    {followLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    {following ? 'Подписан' : 'Подписаться'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleMessage} disabled={messageLoading}
                    className="px-4 py-1.5 text-sm font-semibold rounded-xl border border-white/15 hover:bg-white/10 transition-all flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {messageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    Написать
                  </motion.button>
                  <button onClick={handleShare}
                    className="p-2 rounded-xl border border-white/15 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleBlock} disabled={blockLoading}
                    className={`p-2 rounded-xl border transition-all ${isBlocked ? 'border-red-500/50 text-red-400' : 'border-white/15 hover:bg-white/10'}`}
                    style={{ background: isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)' }}
                    title={isBlocked ? 'Разблокировать' : 'Заблокировать'}>
                    {blockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + status + bio */}
          <div className="mt-3 mb-4">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="text-lg font-bold">{profile.username}</h1>
              {profile.is_verified && <BadgeCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <Circle className={`w-2 h-2 fill-current ${profile.is_online ? 'text-green-500' : 'text-gray-500'}`} />
              <span className="text-xs text-white/50">
                {profile.is_online ? 'онлайн' : `был(а) ${formatLastSeen(profile.last_seen)}`}
              </span>
            </div>
            {profile.full_name && <p className="text-sm text-white/60 mb-1">{profile.full_name}</p>}
            {profile.bio && <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-sm flex items-center gap-1 mt-1 hover:opacity-80 transition-opacity" style={{ color: '#a855f7' }}>
                <LinkIcon className="w-3 h-3" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {profile.profile_song_title && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <Music className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{profile.profile_song_title}</p>
                  {profile.profile_song_artist && <p className="text-xs text-white/50 truncate">{profile.profile_song_artist}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex rounded-2xl mb-4 py-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold">{formatCount(postsCount)}</span>
              <span className="text-xs text-white/50">публикаций</span>
            </div>
            <div className="w-px bg-white/10" />
            <button onClick={() => setShowModal('подписчики')}
              className="flex-1 flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
              <span className="text-lg font-bold">{formatCount(followersCount)}</span>
              <span className="text-xs text-white/50">подписчиков</span>
            </button>
            <div className="w-px bg-white/10" />
            <button onClick={() => setShowModal('подписки')}
              className="flex-1 flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
              <span className="text-lg font-bold">{formatCount(profile.following_count)}</span>
              <span className="text-xs text-white/50">подписок</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/10">
          {tabs.map(({ key, icon: Icon, label }, i) => (
            <button key={key}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wider transition-all relative"
              style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              {i === 0 && (
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #ec4899)' }} />
              )}
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <FollowersModal
          userId={profile.id}
          type={showModal}
          count={showModal === 'подписчики' ? followersCount : profile.following_count}
          onClose={() => setShowModal(null)}
        />
      )}
    </>
  )
}
