import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo, formatCount } from '@/lib/utils'

interface PostPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .eq('id', params.id)
    .single()

  if (!post) return { title: 'Post not found' }

  return {
    title: `${post.user?.username} on Lumina`,
    description: post.caption || `Photo by ${post.user?.username}`,
    openGraph: {
      images: [post.image_url],
      title: `${post.user?.username} on Lumina`,
      description: post.caption || '',
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .eq('id', params.id)
    .single()

  if (!post) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('post_id', post.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .limit(20)

  // Check if liked
  let likedByUser = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .single()
    likedByUser = !!like
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      <div className="glass rounded-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative md:w-1/2 aspect-square bg-black flex-shrink-0">
          <Image
            src={post.image_url}
            alt={post.caption || 'Post'}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Details */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Link href={`/profile/${post.user?.username}`}>
              <UserAvatar user={post.user || null} size="sm" />
            </Link>
            <div>
              <Link href={`/profile/${post.user?.username}`} className="font-semibold text-sm hover:opacity-80">
                {post.user?.username}
              </Link>
              {post.location && (
                <p className="text-xs text-muted-foreground">{post.location}</p>
              )}
            </div>
          </div>

          {/* Caption + Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <div className="flex gap-3">
                <Link href={`/profile/${post.user?.username}`}>
                  <UserAvatar user={post.user || null} size="sm" />
                </Link>
                <div>
                  <p className="text-sm">
                    <Link href={`/profile/${post.user?.username}`} className="font-semibold mr-2 hover:opacity-80">
                      {post.user?.username}
                    </Link>
                    {post.caption}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(post.created_at)}</p>
                </div>
              </div>
            )}

            {comments?.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Link href={`/profile/${comment.user?.username}`}>
                  <UserAvatar user={comment.user || null} size="sm" />
                </Link>
                <div>
                  <p className="text-sm">
                    <Link href={`/profile/${comment.user?.username}`} className="font-semibold mr-2 hover:opacity-80">
                      {comment.user?.username}
                    </Link>
                    {comment.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(comment.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Heart className={`w-5 h-5 ${likedByUser ? 'fill-neon-pink text-neon-pink' : ''}`} />
                <span className="text-sm font-semibold text-foreground">{formatCount(post.likes_count)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-semibold text-foreground">{formatCount(post.comments_count)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {formatTimeAgo(post.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
