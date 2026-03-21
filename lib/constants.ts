export const APP_NAME = 'Lumina'
export const APP_DESCRIPTION = 'Share your world'

export const STORAGE_BUCKETS = {
  POSTS: 'posts',
  AVATARS: 'avatars',
  STORIES: 'stories',
} as const

export const STORY_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export const POST_IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
export const AVATAR_IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const STORY_IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const PAGINATION = {
  FEED_LIMIT: 10,
  EXPLORE_LIMIT: 36,
  SEARCH_LIMIT: 10,
  NOTIFICATIONS_LIMIT: 50,
  MESSAGES_LIMIT: 50,
  COMMENTS_LIMIT: 30,
} as const

export const STORY_VIEWER_DURATION = 5000 // ms per story

export const USERNAME_REGEX = /^[a-z0-9_.]{1,30}$/
export const WEBSITE_REGEX = /^https?:\/\/.+/

export const NAV_ITEMS = [
  { href: '/feed', label: 'Home', icon: 'Home' },
  { href: '/search', label: 'Search', icon: 'Search' },
  { href: '/explore', label: 'Explore', icon: 'Compass' },
  { href: '/stories', label: 'Stories', icon: 'Film' },
  { href: '/messages', label: 'Messages', icon: 'MessageCircle' },
  { href: '/notifications', label: 'Notifications', icon: 'Heart' },
] as const
