'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Send, Loader2 } from 'lucide-react'
import type { Post, Comment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo } from '@/lib/utils'
import UserAvatar from '@/components/ui/UserAvatar'

interface CommentsModalProps {
  post: Post
  currentUserId: string
  onClose: () => void
}

export default function CommentsModal({ post, currentUserId, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadComments()
    loadCurrentUser()
    inputRef.current?.focus()
  }, [])

  const loadCurrentUser = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .single()
    setCurrentUser(data)
  }

  const loadComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, user:users(*)')
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    setComments(data || [])
    setLoading(false)
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newComment.trim() || submitting) return

  setSubmitting(true)

  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: post.id, content: newComment.trim() }),
  })
  const data = await res.json()

  if (res.ok && data.comment) {
    setComments(prev => [...prev, data.comment])
    setNewComment('')
  }
  setSubmitting(false)
}

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full md:max-w-3xl md:rounded-2xl glass border border-white/10 overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Post image */}
          <div className="hidden md:block relative w-96 flex-shrink-0 bg-black">
            <Image
              src={post.image_url}
              alt="post"
              fill
              className="object-contain"
            />
          </div>

          {/* Comments section */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <UserAvatar user={post.user || null} size="sm" />
                <span className="font-semibold text-sm">{post.user?.username}</span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="p-4 border-b border-white/5">
                <p className="text-sm">
                  <span className="font-semibold mr-2">{post.user?.username}</span>
                  {post.caption}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(post.created_at)}</p>
              </div>
            )}

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/profile/${comment.user?.username}`}>
                      <UserAvatar user={comment.user || null} size="sm" />
                    </Link>
                    <div className="flex-1">
                      <p className="text-sm">
                        <Link
                          href={`/profile/${comment.user?.username}`}
                          className="font-semibold hover:opacity-80 transition-opacity mr-2"
                        >
                          {comment.user?.username}
                        </Link>
                        {comment.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(comment.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-3 items-center">
              <UserAvatar user={currentUser} size="sm" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Добавить комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="text-neon-blue disabled:opacity-30 transition-opacity"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
