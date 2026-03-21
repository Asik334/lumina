import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { otherUserId } = await request.json()
  if (!otherUserId) return NextResponse.json({ error: 'otherUserId required' }, { status: 400 })

  // Check if conversation already exists (either direction)
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
    )
    .single()

  if (existing) {
    return NextResponse.json({ conversation: existing })
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({ participant_1: user.id, participant_2: otherUserId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversation })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (conversationId) {
    // Get messages for a conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages })
  }

  // Get all conversations for the user
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*, participant_1_user:users!conversations_participant_1_fkey(*), participant_2_user:users!conversations_participant_2_fkey(*)')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = conversations?.map(conv => ({
    ...conv,
    other_user: conv.participant_1 === user.id ? conv.participant_2_user : conv.participant_1_user,
  })) || []

  return NextResponse.json({ conversations: formatted })
}
