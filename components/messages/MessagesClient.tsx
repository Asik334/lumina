'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo } from '@/lib/utils'
import { Send, MessageCircle, PenSquare } from 'lucide-react'
import NewChatModal from './NewChatModal'
import { useSearchParams } from 'next/navigation'

interface MessagesClientProps {
  currentUser: any
  conversations: any[]
}

export default function MessagesClient({ currentUser, conversations: initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === chatId)
      if (conv) setSelectedConv(conv)
    }
  }, [searchParams, conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedConv) return
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:users!sender_id(id, username, avatar_url)')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    loadMessages()

    const channel = supabase
      .channel(`messages:${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        const newMsg = payload.new as any
        // Не дублируем если уже добавили локально
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id)
          if (exists) return prev
          return [...prev, { ...newMsg, sender: { id: newMsg.sender_id } }]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConv])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return
    setSending(true)
    const text = newMessage.trim()
    setNewMessage('')

    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConv.id,
        sender_id: currentUser.id,
        receiver_id: getOtherUser(selectedConv)?.id,
        content: text,
      })
      .select('*')
      .single()

    // Добавляем сразу локально
    if (inserted) {
      setMessages(prev => [...prev, { ...inserted, sender: currentUser }])
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), last_message: text })
      .eq('id', selectedConv.id)

    setSending(false)
  }

  const getOtherUser = (conv: any) => {
    return conv.other_user ||
      (conv.participant_1 === currentUser.id ? conv.participant_2_user : conv.participant_1_user)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-5xl mx-auto border border-white/10 rounded-2xl overflow-hidden glass">
      <div className="w-80 border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Сообщения</h2>
          <button onClick={() => setShowNewChat(true)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
            <PenSquare className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6 text-center">
              <MessageCircle className="w-10 h-10 opacity-20" />
              <p className="text-sm">Нет сообщений</p>
              <button onClick={() => setShowNewChat(true)} className="text-xs text-blue-400 hover:underline">
                Написать кому-нибудь
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const other = getOtherUser(conv)
              if (!other) return null
              return (
                <button key={conv.id} onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${selectedConv?.id === conv.id ? 'bg-white/10' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {other.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">@{other.username}</p>
                    {conv.last_message && <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>}
                  </div>
                  {conv.last_message_at && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(conv.last_message_at)}</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                {getOtherUser(selectedConv)?.username?.[0]?.toUpperCase()}
              </div>
              <p className="font-semibold">@{getOtherUser(selectedConv)?.username}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 rounded-bl-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {formatTimeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/10 flex items-center gap-3">
              <input type="text" value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Написать сообщение..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all" />
              <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                className="p-2.5 rounded-xl bg-blue-600 text-white hover:opacity-90 disabled:opacity-40 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <MessageCircle className="w-16 h-16 opacity-10" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Ваши сообщения</p>
              <p className="text-sm mt-1">Выберите беседу или начните новую</p>
            </div>
            <button onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <PenSquare className="w-4 h-4" />
              Новое сообщение
            </button>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal currentUserId={currentUser.id} onClose={() => setShowNewChat(false)} />
      )}
    </div>
  )
}


