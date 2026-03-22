'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Image, Bell, TrendingUp, Trash2, ShieldCheck,
  Eye, BarChart2, UserCheck, Ban, ShieldAlert, Search, Loader2
} from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'
import {
  adminDeletePost,
  adminDeleteUser,
  adminToggleVerify,
  adminToggleBan,
  adminToggleAdmin,
} from '@/lib/admin-actions'

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
  const [searchUsers, setSearchUsers] = useState('')
  const [searchPosts, setSearchPosts] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Удалить эту публикацию? Действие необратимо.')) return
    setLoadingId(postId)
    const result = await adminDeletePost(postId)
    if (result.error) { showToast(result.error, 'err') }
    else { setPosts(prev => prev.filter(p => p.id !== postId)); showToast('Публикация удалена') }
    setLoadingId(null)
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Удалить @${username}? Это удалит все его данные.`)) return
    setLoadingId(userId)
    const result = await adminDeleteUser(userId)
    if (result.error) { showToast(result.error, 'err') }
    else { setUsers(prev => prev.filter(u => u.id !== userId)); showToast(`@${username} удалён`) }
    setLoadingId(null)
  }

  const handleVerify = async (userId: string, current: boolean) => {
    setLoadingId(userId + '-verify')
    const result = await adminToggleVerify(userId, current)
    if (result.error) { showToast(result.error, 'err') }
    else { setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: result.newState } : u)); showToast(result.newState ? 'Верификация выдана' : 'Верификация снята') }
    setLoadingId(null)
  }

  const handleBan = async (userId: string, username: string, current: boolean) => {
    if (!confirm(`${current ? 'Разблокировать' : 'Заблокировать'} @${username}?`)) return
    setLoadingId(userId + '-ban')
    const result = await adminToggleBan(userId, current)
    if (result.error) { showToast(result.error, 'err') }
    else { setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: result.newState } : u)); showToast(result.newState ? `@${username} заблокирован` : `@${username} разблокирован`) }
    setLoadingId(null)
  }

  const handleToggleAdmin = async (userId: string, username: string, current: boolean) => {
    if (!confirm(`${current ? 'Снять права админа у' : 'Назначить админом'} @${username}?`)) return
    setLoadingId(userId + '-admin')
    const result = await adminToggleAdmin(userId, current)
    if (result.error) { showToast(result.error, 'err') }
    else { setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u)); showToast(current ? 'Права сняты' : `@${username} теперь админ`) }
    setLoadingId(null)
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredPosts = posts.filter(p =>
    p.user?.username?.toLowerCase().includes(searchPosts.toLowerCase()) ||
    p.caption?.toLowerCase().includes(searchPosts.toLowerCase())
  )

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
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
            toast.type === 'ok'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.msg}
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">Управление контентом и пользователями</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold">{value.toLocaleString('ru-RU')}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 glass rounded-xl p-1 border border-white/5 mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-neon-purple" />Топ публикаций по лайкам</h2>
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

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <h2 className="font-semibold flex-1">Пользователи</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" placeholder="Поиск..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-white/30 transition-all w-44" />
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {filteredUsers.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Ничего не найдено</p>}
              {filteredUsers.map(user => (
                <div key={user.id} className={`flex items-center gap-4 p-4 transition-colors ${user.is_banned ? 'bg-red-500/5' : 'hover:bg-white/3'}`}>
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">@{user.username}</p>
                      {user.is_verified && <span className="text-xs text-neon-blue bg-neon-blue/10 px-1.5 py-0.5 rounded-full">✓ Верифицирован</span>}
                      {user.is_admin && <span className="text-xs text-neon-purple bg-neon-purple/10 px-1.5 py-0.5 rounded-full">Админ</span>}
                      {user.is_banned && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">Заблокирован</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.full_name || 'Имя не указано'} · {formatTimeAgo(user.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleVerify(user.id, user.is_verified)} disabled={loadingId === user.id + '-verify'} title={user.is_verified ? 'Снять верификацию' : 'Верифицировать'} className={`p-2 rounded-lg transition-colors ${user.is_verified ? 'text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/20' : 'text-muted-foreground hover:bg-white/5 hover:text-neon-blue'}`}>
                      {loadingId === user.id + '-verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleBan(user.id, user.username, user.is_banned)} disabled={loadingId === user.id + '-ban'} title={user.is_banned ? 'Разблокировать' : 'Заблокировать'} className={`p-2 rounded-lg transition-colors ${user.is_banned ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-400'}`}>
                      {loadingId === user.id + '-ban' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleToggleAdmin(user.id, user.username, user.is_admin)} disabled={loadingId === user.id + '-admin'} title={user.is_admin ? 'Снять права админа' : 'Назначить админом'} className={`p-2 rounded-lg transition-colors ${user.is_admin ? 'text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20' : 'text-muted-foreground hover:bg-white/5 hover:text-neon-purple'}`}>
                      {loadingId === user.id + '-admin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDeleteUser(user.id, user.username)} disabled={loadingId === user.id} className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50">
                      {loadingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'posts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <h2 className="font-semibold flex-1">Публикации</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" placeholder="Поиск..." value={searchPosts} onChange={e => setSearchPosts(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-white/30 transition-all w-44" />
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {filteredPosts.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Ничего не найдено</p>}
              {filteredPosts.map(post => (
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={`/posts/${post.id}`} target="_blank" className="p-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                      <Eye className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDeletePost(post.id)} disabled={loadingId === post.id} className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50">
                      {loadingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
