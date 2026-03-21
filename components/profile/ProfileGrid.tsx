'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Post } from '@/types'
import { formatCount } from '@/lib/utils'

interface ProfileGridProps {
  posts: Post[]
}

export default function ProfileGrid({ posts }: ProfileGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
          <span className="text-3xl">📷</span>
        </div>
        <h3 className="font-bold text-lg mb-2">No Posts Yet</h3>
        <p className="text-muted-foreground text-sm">Share your first moment</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className="relative aspect-square bg-white/5 cursor-pointer group overflow-hidden"
          onMouseEnter={() => setHoveredId(post.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <Image
            src={post.image_url}
            alt={post.caption || 'Post'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 300px"
          />

          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hoveredId === post.id ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2 text-white font-semibold">
              <Heart className="w-5 h-5 fill-white" />
              <span>{formatCount(post.likes_count)}</span>
            </div>
            <div className="flex items-center gap-2 text-white font-semibold">
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{formatCount(post.comments_count)}</span>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
