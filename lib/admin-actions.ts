'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Вспомогательная функция — проверяет что текущий юзер админ
async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован', supabase: null, user: null }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { error: 'Нет прав', supabase: null, user: null }

  return { error: null, supabase, user }
}

// Удалить пост (с удалением файла из storage)
export async function adminDeletePost(postId: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { data: post } = await supabase
    .from('posts')
    .select('image_url')
    .eq('id', postId)
    .single()

  if (post?.image_url) {
    const urlParts = post.image_url.split('/posts/')
    if (urlParts[1]) {
      await supabase.storage.from('posts').remove([urlParts[1]])
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// Удалить пользователя
export async function adminDeleteUser(userId: string) {
  const { error: authError, supabase, user: admin } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  // Нельзя удалить самого себя
  if (userId === admin!.id) return { error: 'Нельзя удалить собственный аккаунт' }

  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// Верифицировать / снять верификацию
export async function adminToggleVerify(userId: string, currentState: boolean) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('users')
    .update({ is_verified: !currentState })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true, newState: !currentState }
}

// Заблокировать / разблокировать пользователя
export async function adminToggleBan(userId: string, currentState: boolean) {
  const { error: authError, supabase, user: admin } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  if (userId === admin!.id) return { error: 'Нельзя заблокировать себя' }

  const { error } = await supabase
    .from('users')
    .update({ is_banned: !currentState })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true, newState: !currentState }
}

// Назначить / снять администратора
export async function adminToggleAdmin(userId: string, currentState: boolean) {
  const { error: authError, supabase, user: admin } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  if (userId === admin!.id) return { error: 'Нельзя изменить собственные права' }

  const { error } = await supabase
    .from('users')
    .update({ is_admin: !currentState })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
