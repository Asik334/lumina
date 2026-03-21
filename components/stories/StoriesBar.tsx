'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import UserAvatar from '@/components/ui/UserAvatar'
import type { StoryGroup } from '@/types'

interface StoriesBarProps {
  storyGroups: StoryGroup[]
  currentUserId: string
}

export default function StoriesBar({ storyGroups, currentUserId }: StoriesBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 200
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  return (
    <div className="relative mb-6 glass rounded-2xl p-4">
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto hide-scrollbar"
      >
        {storyGroups.map((group) => (
          <Link
            key={group.user.id}
            href={`/stories/${group.user.id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
          >
            <UserAvatar
              user={group.user}
              size="lg"
              hasStory={true}
              storyViewed={!group.hasUnviewed}
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center">
              {group.user.id === currentUserId ? 'Ваша история' : group.user.username}
            </span>
          </Link>
        ))}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
