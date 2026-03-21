'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'

interface StoryViewerProps {
  params: { id: string }
}

export default function StoryViewerPage({ params }: StoryViewerProps) {
  const router = useRouter()
  const [stories, setStories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const DURATION = 5000

  useEffect(() => {
    loadStories()
  }, [params.id])

  useEffect(() => {
    if (!stories.length || paused) return
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext()
          return 0
        }
        return prev + (100 / (DURATION / 100))
      })
    }, 100)
    return () => clearInterval(interval)
  }, [stories.length, currentIndex, paused])

  useEffect(() => {
    setProgress(0)
    if (stories[currentIndex]) {
      markViewed(stories[currentIndex].id)
    }
  }, [currentIndex])

  const loadStories = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('stories')
      .select('*, user:users(*)')
      .eq('user_id', params.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
    setStories(data || [])
    setLoading(false)
  }

  const markViewed = async (storyId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('story_views')
      .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' })
  }

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      router.back()
    }
  }, [currentIndex, stories.length, router])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }, [currentIndex])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!stories.length) {
    router.back()
    return null
  }

  const story = stories[currentIndex]

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full md:h-[90vh] md:rounded-2xl overflow-hidden">
        {/* Image */}
        <Image
          src={story.image_url}
          alt="Story"
          fill
          className="object-cover"
          priority
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <UserAvatar user={story.user} size="sm" />
            <div>
              <p className="text-white font-semibold text-sm">{story.user?.username}</p>
              <p className="text-white/70 text-xs">{formatTimeAgo(story.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused(p => !p)}
              className="text-white p-1"
            >
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button onClick={() => router.back()} className="text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <p className="text-white text-sm text-center drop-shadow-lg">{story.caption}</p>
          </div>
        )}

        {/* Navigation zones */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-20 opacity-0"
          onClick={goPrev}
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-20 opacity-0"
          onClick={goNext}
        />
      </div>

      {/* Close backdrop */}
      <button
        className="hidden md:block absolute inset-0 -z-10"
        onClick={() => router.back()}
      />
    </div>
  )
}
