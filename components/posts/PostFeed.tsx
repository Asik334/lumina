'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Post } from '@/types'
import PostCard from './PostCard'

interface PostFeedProps {
  initialPosts: Post[]
  currentUserId: string
}

export default function PostFeed({ initialPosts, currentUserId }: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts)

  const handleLikeUpdate = (postId: string, liked: boolean, newCount: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked_by_user: liked, likes_count: newCount }
          : p
      )
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">📸</span>
        </div>
        <h3 className="font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-sm">
          Follow people to see their posts here, or create your first post!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onLikeUpdate={handleLikeUpdate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
