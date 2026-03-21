import Image from 'next/image'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: User | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  hasStory?: boolean
  storyViewed?: boolean
  className?: string
}

const sizeMap = {
  xs: { outer: 'w-6 h-6', text: 'text-[10px]', img: 24 },
  sm: { outer: 'w-8 h-8', text: 'text-xs', img: 32 },
  md: { outer: 'w-10 h-10', text: 'text-sm', img: 40 },
  lg: { outer: 'w-14 h-14', text: 'text-base', img: 56 },
  xl: { outer: 'w-20 h-20', text: 'text-lg', img: 80 },
}

export default function UserAvatar({
  user,
  size = 'md',
  hasStory = false,
  storyViewed = false,
  className,
}: UserAvatarProps) {
  const { outer, text, img } = sizeMap[size]

  const avatar = (
    <div className={cn('relative rounded-full flex-shrink-0', outer, className)}>
      {user?.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.username}
          width={img}
          height={img}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className={cn(
          'w-full h-full rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center font-semibold text-white',
          text
        )}>
          {user ? getInitials(user.full_name || user.username) : '?'}
        </div>
      )}
    </div>
  )

  if (hasStory) {
    return (
      <div className={cn(
        'rounded-full p-[2px] flex-shrink-0',
        storyViewed ? 'story-ring-seen' : 'story-ring'
      )}>
        <div className="rounded-full p-[2px] bg-background">
          {avatar}
        </div>
      </div>
    )
  }

  return avatar
}
