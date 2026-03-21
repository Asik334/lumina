import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessagesClient from '@/components/messages/MessagesClient'

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, participant_1_user:users!conversations_participant_1_fkey(*), participant_2_user:users!conversations_participant_2_fkey(*)')
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  const formattedConversations = conversations?.map(conv => ({
    ...conv,
    other_user: conv.participant_1 === user.id ? conv.participant_2_user : conv.participant_1_user,
  })) || []

  return (
    <MessagesClient
      conversations={formattedConversations}
      currentUserId={user.id}
    />
  )
}
