'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// =============================================
// СХЕМЫ ВАЛИДАЦИИ
// =============================================

const signUpSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
  username: z.string().regex(/^[a-z0-9_.]{3,30}$/, 'Имя пользователя: 3–30 символов, только a-z, 0-9, _ и .'),
  fullName: z.string().max(60, 'Имя не более 60 символов').optional(),
})

const profileSchema = z.object({
  username: z.string().regex(/^[a-z0-9_.]{1,30}$/, 'Некорректный формат'),
  fullName: z.string().max(60).optional(),
  bio: z.string().max(300, 'Биография не более 300 символов').optional(),
  website: z.union([z.string().regex(/^https?:\/\/.+/, 'Некорректный URL'), z.literal('')]).optional(),
})

const commentSchema = z.object({
  content: z.string().min(1, 'Комментарий не может быть пустым').max(1000, 'Максимум 1000 символов'),
})

// =============================================
// AUTH ACTIONS
// =============================================

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}

export async function signUp(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    fullName: formData.get('fullName') as string,
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password, username, fullName } = parsed.data

  const supabase = createClient()

  // Check username availability
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) {
    return { error: 'Это имя пользователя уже занято' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// =============================================
// PROFILE ACTIONS
// =============================================

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    username: (formData.get('username') as string).toLowerCase().trim(),
    fullName: (formData.get('fullName') as string).trim(),
    bio: (formData.get('bio') as string).trim(),
    website: (formData.get('website') as string).trim(),
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { username, fullName, bio, website } = parsed.data

  // Check uniqueness if changed
  const { data: currentProfile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  if (username !== currentProfile?.username) {
    const { data: taken } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (taken) return { error: 'Это имя пользователя уже занято' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      username,
      full_name: fullName || null,
      bio: bio || null,
      website: website || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/profile/${username}`)
  return { success: true, username }
}

// =============================================
// FOLLOW ACTIONS
// =============================================

export async function followUser(followingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('followers')
    .insert({ follower_id: user.id, following_id: followingId })

  if (error) return { error: error.message }

  const { data: followed } = await supabase
    .from('users')
    .select('username')
    .eq('id', followingId)
    .single()

  await supabase.from('notifications').insert({
    user_id: followingId,
    actor_id: user.id,
    type: 'follow',
  })

  if (followed) revalidatePath(`/profile/${followed.username}`)
  return { success: true }
}

export async function unfollowUser(followingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) return { error: error.message }

  const { data: followed } = await supabase
    .from('users')
    .select('username')
    .eq('id', followingId)
    .single()

  if (followed) revalidatePath(`/profile/${followed.username}`)
  return { success: true }
}

// =============================================
// POST ACTIONS
// =============================================

export async function deletePost(postId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: post } = await supabase
    .from('posts')
    .select('user_id, image_url')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    return { error: 'Forbidden' }
  }

  // Delete image from storage
  const urlParts = post.image_url.split('/posts/')
  if (urlParts[1]) {
    await supabase.storage.from('posts').remove([urlParts[1]])
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { success: true }
}

export async function likePost(postId: string, postOwnerId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('likes').insert({ user_id: user.id, post_id: postId })

  if (postOwnerId !== user.id) {
    await supabase.from('notifications').insert({
      user_id: postOwnerId,
      actor_id: user.id,
      type: 'like',
      post_id: postId,
    })
  }

  return { success: true }
}

export async function unlikePost(postId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('likes').delete()
    .eq('user_id', user.id)
    .eq('post_id', postId)

  return { success: true }
}

// =============================================
// COMMENT ACTIONS
// =============================================

export async function addComment(postId: string, content: string, parentId?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = commentSchema.safeParse({ content })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      post_id: postId,
      content: parsed.data.content.trim(),
      parent_id: parentId || null,
    })
    .select('*, user:users(*)')
    .single()

  if (error) return { error: error.message }

  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (post && post.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: post.user_id,
      actor_id: user.id,
      type: parentId ? 'reply' : 'comment',
      post_id: postId,
      comment_id: comment.id,
    })
  }

  revalidatePath('/feed')
  return { success: true, comment }
}

export async function deleteComment(commentId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, post_id')
    .eq('id', commentId)
    .single()

  if (!comment || comment.user_id !== user.id) {
    return { error: 'Forbidden' }
  }

  await supabase.from('comments').delete().eq('id', commentId)

  revalidatePath('/feed')
  return { success: true }
}


// =============================================
// PUSH УВЕДОМЛЕНИЯ
// =============================================

async function sendPush(targetUserId: string, title: string, body: string, url: string, type: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, title, body, url, type }),
    })
  } catch {
    // Push не критичен — не прерываем основной flow
  }
}
