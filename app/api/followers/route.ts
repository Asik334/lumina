import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { followingId } = await request.json()
  if (!followingId) return NextResponse.json({ error: 'followingId required' }, { status: 400 })
  if (followingId === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

  const { error } = await supabase
    .from('followers')
    .insert({ follower_id: user.id, following_id: followingId })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already following' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: actor } = await supabase
    .from('users')
    .select('avatar_url, username')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: followingId,
    actor_id: user.id,
    type: 'follow',
    post_id: null,
    comment_id: null,
  })

  await sendPush(
    followingId,
    '👤 Новый подписчик',
    `${actor?.username || 'Кто-то'} подписался(ась) на вас`,
    actor?.avatar_url
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const followingId = searchParams.get('followingId')

  if (!followingId) return NextResponse.json({ error: 'followingId required' }, { status: 400 })

  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') || 'followers'

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const query = type === 'followers'
    ? supabase.from('followers').select('follower:users!followers_follower_id_fkey(*)').eq('following_id', userId)
    : supabase.from('followers').select('following:users!followers_following_id_fkey(*)').eq('follower_id', userId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
