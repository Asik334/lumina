import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  // Проверяем только is_admin из БД — никаких захардкоженных email
  if (!profile?.is_admin) redirect('/feed')

  const [
    { count: usersCount },
    { count: postsCount },
    { count: notifCount },
    { data: recentUsers },
    { data: recentPosts },
    { data: topPosts },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('posts').select('*, user:users(username, avatar_url, id)').order('created_at', { ascending: false }).limit(20),
    supabase.from('posts').select('*, user:users(username, avatar_url)').order('likes_count', { ascending: false }).limit(5),
  ])

  return (
    <AdminClient
      stats={{ usersCount: usersCount || 0, postsCount: postsCount || 0, notifCount: notifCount || 0 }}
      recentUsers={recentUsers || []}
      recentPosts={recentPosts || []}
      topPosts={topPosts || []}
    />
  )
}
