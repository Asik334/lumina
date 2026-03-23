export interface User {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  website: string | null
  is_private: boolean
  is_verified: boolean
  is_admin?: boolean
  is_banned?: boolean
  posts_count: number
  followers_count: number
  following_count: number
  is_online?: boolean
  last_seen?: string | null
  profile_song?: string | null
  profile_song_title?: string | null
  profile_song_artist?: string | null
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
  hashtags?: string[]
  created_at: string
  updated_at: string
  user?: User
  liked_by_user?: boolean
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

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  parent_id: string | null
  created_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply'
  post_id: string | null
  comment_id: string | null
  is_read: boolean
  created_at: string
  actor?: User
  post?: Post
}

export interface Highlight {
  id: string
  user_id: string
  title: string
  cover_url: string | null
  created_at: string
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

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  created_at: string
  other_user?: User
  last_message?: Message
}