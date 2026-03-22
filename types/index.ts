// =============================================
// LUMINA — TypeScript типы (новая схема)
// =============================================

export interface User {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  website: string | null
  is_private: boolean
  is_verified: boolean
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  caption: string | null
  image_url: string
  location: string | null
  likes_count: number
  comments_count: number
  reposts_count: number
  saves_count: number
  // репост / цитата
  is_repost: boolean
  original_post_id: string | null
  quote_text: string | null
  created_at: string
  updated_at: string
  // joins
  user?: User
  liked_by_user?: boolean
  saved_by_user?: boolean
  reposted_by_user?: boolean
  original_post?: Post
  hashtags?: Hashtag[]
}

export interface Hashtag {
  id: string
  name: string          // без #, нижний регистр
  posts_count: number
  created_at: string
}

export interface PostHashtag {
  post_id: string
  hashtag_id: string
}

export interface Story {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  expires_at: string
  views_count: number
  created_at: string
  user?: User
  viewed_by_user?: boolean
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id: string
  viewed_at: string
}

export interface StoryGroup {
  user: User
  stories: Story[]
  hasUnviewed: boolean
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  user?: User
  replies?: Comment[]
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
  post?: Post
}

export interface Repost {
  id: string
  user_id: string
  original_post_id: string
  repost_post_id: string | null
  quote_text: string | null
  created_at: string
  user?: User
  original_post?: Post
}

export interface Follower {
  id: string
  follower_id: string
  following_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
  other_user?: User
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: User
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'repost' | 'quote' | 'bookmark'
  post_id: string | null
  comment_id: string | null
  is_read: boolean
  created_at: string
  actor?: User
  post?: Post
}
