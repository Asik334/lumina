import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

export default async function ExplorePage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .order('likes_count', { ascending: false })
    .limit(36)

  return (
    <div className="max-w-4xl mx-auto px-2 py-8">
      <h1 className="text-2xl font-bold mb-6 px-2">Explore</h1>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className={`relative bg-white/5 overflow-hidden group ${
                i % 7 === 0 ? 'col-span-2 row-span-2' : 'aspect-square'
              }`}
              style={{ aspectRatio: i % 7 === 0 ? '2/2' : '1/1' }}
            >
              <Image
                src={post.image_url}
                alt={post.caption || 'Post'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 33vw, 400px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-4 text-white font-semibold">
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>No posts to explore yet. Be the first to share!</p>
        </div>
      )}
    </div>
  )
}
