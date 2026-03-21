'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User, Post } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'
import { useDebounce } from '@/hooks/useDebounce'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'people' | 'posts'>('people')

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setUsers([])
      setPosts([])
      return
    }
    searchAll(debouncedQuery)
  }, [debouncedQuery])

  const searchAll = async (q: string) => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: userResults }, { data: postResults }] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('posts')
        .select('*, user:users(*)')
        .ilike('caption', `%${q}%`)
        .limit(12),
    ])

    setUsers(userResults || [])
    setPosts(postResults || [])
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search people, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full glass border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Tabs */}
            <div className="flex gap-1 mb-6 glass rounded-xl p-1">
              {(['people', 'posts'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                    tab === t ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t} {t === 'people' ? `(${users.length})` : `(${posts.length})`}
                </button>
              ))}
            </div>

            {tab === 'people' && (
              <div className="space-y-2">
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No people found</p>
                ) : (
                  users.map(user => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-3 rounded-xl glass-hover"
                    >
                      <UserAvatar user={user} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{user.username}</p>
                        {user.full_name && (
                          <p className="text-xs text-muted-foreground">{user.full_name}</p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {tab === 'posts' && (
              <div className="grid grid-cols-3 gap-1">
                {posts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 col-span-3">No posts found</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
                      <Image
                        src={post.image_url}
                        alt={post.caption || 'Post'}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Default explore when no search */}
      {!query && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Search for people or posts</p>
        </div>
      )}
    </div>
  )
}
