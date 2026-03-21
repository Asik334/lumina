'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, ArrowLeft, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'

interface MessagesClientProps {
  conversations: any[]
  currentUserId: string
}

export default function MessagesClient({ conversations, currentUserId }: MessagesClientProps) {
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeConv) return

    loadMessages(activeConv.id)

    // Subscribe to new messages via Supabase Realtime
    const supabase = createClient()
    const channel = supabase
      .channel(`conv:${activeConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        async (payload) => {
          const { data: msgWithUser } = await supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single()
          if (msgWithUser) {
            setMessages(prev => [...prev, msgWithUser])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConv?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (convId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)

    const supabase = createClient()
    const otherId = activeConv.other_user?.id

    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: currentUserId,
      receiver_id: otherId,
      content: newMessage.trim(),
    })

    await supabase
      .from('conversations')
      .update({ last_message: newMessage.trim(), last_message_at: new Date().toISOString() })
      .eq('id', activeConv.id)

    setNewMessage('')
    setSending(false)
  }

  return (
    <div className="flex h-screen">
      {/* Conversations list */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors text-left ${
                  activeConv?.id === conv.id ? 'bg-white/5' : ''
                }`}
              >
                <UserAvatar user={conv.other_user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.other_user?.username}</p>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  )}
                </div>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(conv.last_message_at)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar user={activeConv.other_user} size="sm" />
              <div>
                <p className="font-semibold text-sm">{activeConv.other_user?.username}</p>
                <p className="text-xs text-muted-foreground">{activeConv.other_user?.full_name}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <UserAvatar user={msg.sender as any} size="xs" className="mr-2 mt-auto" />
                        )}
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-neon-gradient text-white rounded-br-sm'
                              : 'glass border border-white/10 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 glass border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 rounded-full bg-neon-gradient flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
            <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
