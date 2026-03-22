'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'

interface StoryViewerProps {
  params: { id: string }
}

const DURATION = 5000

export default function StoryViewerPage({ params }: StoryViewerProps) {
  const router = useRouter()
  const [stories, setStories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [viewsCount, setViewsCount] = useState<Record<string, number>>({})

  // Touch/свайп
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)

  // Загрузка историй
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: storiesData }, { data: { user } }] = await Promise.all([
        supabase
          .from('stories')
          .select('*, user:users(*)')
          .eq('user_id', params.id)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true }),
        supabase.auth.getUser(),
      ])
      setStories(storiesData || [])
      setCurrentUser(user)
      setLoading(false)
    }
    load()
  }, [params.id])

  // Прогресс-бар — сбрасывается при смене истории
  useEffect(() => {
    setProgress(0)
    if (!stories[currentIndex]) return
    markViewed(stories[currentIndex].id)
    loadViewsCount(stories[currentIndex].id)
  }, [currentIndex, stories])

  useEffect(() => {
    if (paused || !stories.length) return
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
  }, [paused, stories.length, currentIndex])

  const markViewed = async (storyId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('story_views')
      .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' })
  }

  const loadViewsCount = async (storyId: string) => {
    const supabase = createClient()
    const { count } = await supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId)
    if (count !== null) setViewsCount(prev => ({ ...prev, [storyId]: count }))
  }

  const goNext = useCallback(() => {
    setProgress(0)
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      router.back()
    }
  }, [currentIndex, stories.length, router])

  const goPrev = useCallback(() => {
    setProgress(0)
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }, [currentIndex])

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    holdTimer.current = setTimeout(() => setPaused(true), 150)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    setPaused(false)

    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    // Свайп вниз — закрыть
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      router.back()
      return
    }
    // Свайп влево/вправо — навигация
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext()
      else goPrev()
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Удержание мышью — пауза
  const onMouseDown = () => {
    holdTimer.current = setTimeout(() => setPaused(true), 150)
  }
  const onMouseUp = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    setPaused(false)
  }

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
  const isOwner = currentUser?.id === story.user_id

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={story.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-sm h-full md:h-[90vh] md:rounded-2xl overflow-hidden select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Фото */}
          <Image
            src={story.image_url}
            alt="Story"
            fill
            className="object-cover"
            priority
            draggable={false}
          />

          {/* Затемнение */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/50 pointer-events-none" />

          {/* Прогресс-бары */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                    transition: i === currentIndex ? 'none' : undefined,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Шапка */}
          <div className="absolute top-7 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <UserAvatar user={story.user} size="sm" />
              <div>
                <p className="text-white font-semibold text-sm drop-shadow">{story.user?.username}</p>
                <p className="text-white/70 text-xs">{formatTimeAgo(story.created_at)}</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="text-white p-1.5 pointer-events-auto hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Подпись */}
          {story.caption && (
            <div className="absolute bottom-16 left-4 right-4 z-10 pointer-events-none">
              <p className="text-white text-sm text-center drop-shadow-lg bg-black/20 rounded-xl px-3 py-2">
                {story.caption}
              </p>
            </div>
          )}

          {/* Просмотры (только для автора) */}
          {isOwner && (
            <div className="absolute bottom-6 left-4 z-10 flex items-center gap-1.5 text-white/80 pointer-events-none">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{viewsCount[story.id] ?? 0}</span>
            </div>
          )}

          {/* Индикатор паузы */}
          <AnimatePresence>
            {paused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-6 bg-white rounded-full" />
                    <div className="w-1.5 h-6 bg-white rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Зоны навигации (невидимые) */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-20 opacity-0"
            onClick={goPrev}
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-20 opacity-0"
            onClick={goNext}
          />

          {/* Стрелки на десктопе */}
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center transition-colors text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={goNext}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center transition-colors text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Фон */}
      <button
        className="hidden md:block absolute inset-0 -z-10"
        onClick={() => router.back()}
      />
    </div>
  )
}
