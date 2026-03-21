'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Image, Bell, TrendingUp, Trash2, ShieldCheck,
  Eye, BarChart2, UserCheck, AlertTriangle
} from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AdminClientProps {
  stats: { usersCount: number; postsCount: number; notifCount: number }
  recentUsers: any[]
  recentPosts: any[]
  topPosts: any[]
}

export default function AdminClient({ stats, recentUsers, recentPosts, topPosts }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview')
  const [users, setUsers] = useState(recentUsers)
  const [posts, setPosts] = useState(recentPosts)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Удалить эту публикацию? Действие необратимо.')) return
    setDeletingId(postId)
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
    setDeletingId(null)
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Удалить пользователя @${username}? Это удалит все его данные.`)) return
    setDeletingId(userId)
    const supabase = createClient()
    await supabase.from('users').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    setDeletingId(null)
  }

  const handleVerifyUser = async (userId: string, currentState: boolean) => {
    const supabase = createClient()
    await supabase.from('users').update({ is_verified: !currentState }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentState } : u))
  }

  const statCards = [
    { label: 'Пользователей', value: stats.usersCount, icon: Users, color: 'text-neon-blue' },
    { label: 'Публикаций', value: stats.postsCount, icon: Image, color: 'text-neon-purple' },
    { label: 'Непрочитанных уведомлений', value: stats.notifCount, icon: Bell, color: 'text-neon-pink' },
  ]

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart2 },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'posts', label: 'Публикации', icon: Image },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">Управление контентом и пользователями</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 border border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold">{value.toLocaleString('ru-RU')}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 border border-white/5 mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neon-purple" />
                Топ публикаций по лайкам
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {topPosts.map((post, i) => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <img src={post.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-white/5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">@{post.user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{post.caption || 'Без подписи'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neon-pink">❤️ {post.likes_count}</p>
                    <p className="text-xs text-muted-foreground">💬 {post.comments_count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold">Последние пользователи</h2>
            </div>
            <div className="divide-y divide-white/5">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">@{user.username}</p>
                      {user.is_verified && (
                        <span className="text-xs text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded-full">✓ Верифицирован</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.full_name || 'Имя не указано'} · {formatTimeAgo(user.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyUser(user.id, user.is_verified)}
                      title={user.is_verified ? 'Снять верификацию' : 'Верифицировать'}
                      className={`p-2 rounded-lg transition-colors ${
                        user.is_verified
                          ? 'text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/20'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-neon-blue'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={deletingId === user.id}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold">Последние публикации</h2>
            </div>
            <div className="divide-y divide-white/5">
              {posts.map(post => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <img src={post.image_url} alt="" className="w-14 h-14 rounded-xl object-cover bg-white/5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">@{post.user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{post.caption || 'Без подписи'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">❤️ {post.likes_count}</span>
                      <span className="text-xs text-muted-foreground">💬 {post.comments_count}</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/posts/${post.id}`}
                      target="_blank"
                      className="p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingId === post.id}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
