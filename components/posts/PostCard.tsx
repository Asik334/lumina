'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Send, Bookmark, MapPin
} from 'lucide-react'
import type { Post } from '@/types'
import { formatTimeAgo, formatCount } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import CommentsModal from './CommentsModal'
import PostOptionsMenu from './PostOptionsMenu'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLikeUpdate: (postId: string, liked: boolean, newCount: number) => void
}

export default function PostCard({ post, currentUserId, onLikeUpdate }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showHeart, setShowHeart] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    const supabase = createClient()
    const newLiked = !liked
    const newCount = newLiked ? likesCount + 1 : likesCount - 1

    setLiked(newLiked)
    setLikesCount(newCount)
    onLikeUpdate(post.id, newLiked, newCount)

    if (newLiked) {
      await supabase.from('likes').insert({ user_id: currentUserId, post_id: post.id })
    } else {
      await supabase.from('likes').delete()
        .eq('user_id', currentUserId)
        .eq('post_id', post.id)
    }

    setIsLiking(false)
  }

  const handleDoubleTap = () => {
    if (!liked) {
      handleLike()
    }
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 1000)
  }

  const likesText = () => {
    if (likesCount === 0) return null
    const last = likesCount % 10
    const lastTwo = likesCount % 100
    if (lastTwo >= 11 && lastTwo <= 19) return `${formatCount(likesCount)} отметок`
    if (last === 1) return `${formatCount(likesCount)} отметка`
    if (last >= 2 && last <= 4) return `${formatCount(likesCount)} отметки`
    return `${formatCount(likesCount)} отметок`
  }

  const commentsText = () => {
    const n = post.comments_count
    const last = n % 10
    const lastTwo = n % 100
    if (lastTwo >= 11 && lastTwo <= 19) return `Все ${n} комментариев`
    if (last === 1) return `Весь ${n} комментарий`
    if (last >= 2 && last <= 4) return `Все ${n} комментария`
    return `Все ${n} комментариев`
  }

  return (
    <>
      <article className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link
            href={`/profile/${post.user?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <UserAvatar user={post.user || null} size="sm" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{post.user?.username}</span>
                {post.user?.is_verified && (
                  <svg className="w-3.5 h-3.5 text-neon-blue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              {post.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {post.location}
                </div>
              )}
            </div>
          </Link>
          <PostOptionsMenu
            postId={post.id}
            postOwnerId={post.user_id}
            currentUserId={currentUserId}
          />
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-white/5" onDoubleClick={handleDoubleTap}>
          <Image
            src={post.image_url}
            alt={post.caption || 'Публикация'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleLike}
                className="transition-colors"
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-200 ${
                    liked
                      ? 'fill-neon-pink text-neon-pink scale-110'
                      : 'text-foreground hover:text-neon-pink'
                  }`}
                />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowComments(true)}
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                className="text-foreground hover:text-muted-foreground transition-colors"
              >
                <Send className="w-6 h-6" />
              </motion.button>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setSaved(!saved)}
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              <Bookmark className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {likesCount > 0 && (
            <p className="font-semibold text-sm">{likesText()}</p>
          )}

          {post.caption && (
            <p className="text-sm leading-relaxed">
              <Link
                href={`/profile/${post.user?.username}`}
                className="font-semibold hover:opacity-80 transition-opacity mr-1"
              >
                {post.user?.username}
              </Link>
              {post.caption}
            </p>
          )}

          {post.comments_count > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {commentsText()}
            </button>
          )}

          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {formatTimeAgo(post.created_at)}
          </p>
        </div>
      </article>

      {showComments && (
        <CommentsModal
          post={post}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  )
}
