import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await request.json()
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: user.id, post_id: postId })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already liked' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get post owner for notification
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

 if (post && post.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: post.user_id,
      actor_id: user.id,
      type: 'like',
      post_id: postId,
    })
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({
        targetUserId: post.user_id,
        title: '❤️ Новый лайк',
        body: 'Кто-то оценил вашу публикацию',
        url: '/notifications',
        type: 'like'
      }),
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('likes')
    .select('user_id, user:users(username, avatar_url)')
    .eq('post_id', postId)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ likes: data, count: data.length })
}
