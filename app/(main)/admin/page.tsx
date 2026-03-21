import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

// Список admin email-ов — замените на свой
const ADMIN_EMAILS = ['admin@lumina.app', 'asik334@gmail.com']

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/feed')
  }

  // Статистика
  const [
    { count: usersCount },
    { count: postsCount },
    { count: notifCount },
    { data: recentUsers },
    { data: recentPosts },
    { data: reportedPosts },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('posts').select('*, user:users(username, avatar_url)').order('created_at', { ascending: false }).limit(10),
    supabase.from('posts').select('*, user:users(username, avatar_url)').order('likes_count', { ascending: false }).limit(5),
  ])

  return (
    <AdminClient
      stats={{ usersCount: usersCount || 0, postsCount: postsCount || 0, notifCount: notifCount || 0 }}
      recentUsers={recentUsers || []}
      recentPosts={recentPosts || []}
      topPosts={reportedPosts || []}
    />
  )
}
