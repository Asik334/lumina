import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comments: data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, content, parentId } = await request.json()
  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: 'postId and content required' }, { status: 400 })
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      post_id: postId,
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select('*, user:users(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: actor } = await supabase
    .from('users')
    .select('avatar_url, username')
    .eq('id', user.id)
    .single()

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

    await sendPush(
      post.user_id,
      '💬 Новый комментарий',
      `${actor?.username || 'Кто-то'} прокомментировал(а) вашу публикацию`,
      actor?.avatar_url
    )
  }

  return NextResponse.json({ comment })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('id')
  if (!commentId) return NextResponse.json({ error: 'comment id required' }, { status: 400 })

  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment || comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
