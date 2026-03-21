'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, ArrowLeft, MessageCircle, Search, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'

interface MessagesClientProps {
  conversations: any[]
  currentUserId: string
}

export default function MessagesClient({ conversations: initialConvs, currentUserId }: MessagesClientProps) {
  const [conversations, setConversations] = useState<any[]>(initialConvs)
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!activeConv) return
    loadMessages(activeConv.id)

    const supabase = createClient()
    const channel = supabase
      .channel(`conv:${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, async (payload) => {
        const { data: msgWithUser } = await supabase
          .from('messages')
          .select('*, sender:users!messages_sender_id_fkey(*)')
          .eq('id', payload.new.id)
          .single()
        if (msgWithUser) {
          setMessages(prev => [...prev, msgWithUser as any])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
    setMessages((data || []) as any)
    setLoading(false)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUserId)
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(6)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
  }

  const startConversation = async (otherUser: any) => {
    const supabase = createClient()

    // Check both directions
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${otherUser.id}),and(participant_1.eq.${otherUser.id},participant_2.eq.${currentUserId})`)
      .maybeSingle()

    if (existing) {
      const conv = { ...existing, other_user: otherUser }
      setActiveConv(conv)
      if (!conversations.find(c => c.id === existing.id)) {
        setConversations(prev => [conv, ...prev])
      }
    } else {
      const { data: created } = await supabase
        .from('conversations')
        .insert({ participant_1: currentUserId, participant_2: otherUser.id })
        .select()
        .single()
      if (created) {
        const newConv = { ...created, other_user: otherUser }
        setConversations(prev => [newConv, ...prev])
        setActiveConv(newConv)
      }
    }

    setSearchQuery('')
    setSearchResults([])
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)

    const supabase = createClient()
    const content = newMessage.trim()
    setNewMessage('')

    const { data: msg } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConv.id,
        sender_id: currentUserId,
        receiver_id: activeConv.other_user?.id,
        content,
      })
      .select('*, sender:users!messages_sender_id_fkey(*)')
      .single()

    if (msg) setMessages(prev => [...prev, msg as any])

    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq('id', activeConv.id)

    setConversations(prev =>
      prev.map(c => c.id === activeConv.id ? { ...c, last_message: content, last_message_at: new Date().toISOString() } : c)
    )

    setSending(false)
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <h1 className="text-lg font-bold mb-3">Сообщения</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Найти пользователя..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full glass border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />}
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2 glass border border-white/10 rounded-xl overflow-hidden"
              >
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => startConversation(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.username}</p>
                      {user.full_name && <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>}
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground text-sm font-semibold mb-1">Нет переписок</p>
              <p className="text-muted-foreground text-xs">Найди пользователя выше чтобы начать чат</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors text-left ${activeConv?.id === conv.id ? 'bg-white/5' : ''}`}
              >
                <UserAvatar user={conv.other_user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.other_user?.username}</p>
                  {conv.last_message && <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>}
                </div>
                {conv.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(conv.last_message_at)}</span>
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
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <button onClick={() => setActiveConv(null)} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar user={activeConv.other_user} size="sm" />
              <div>
                <p className="font-semibold text-sm">{activeConv.other_user?.username}</p>
                {activeConv.other_user?.full_name && <p className="text-xs text-muted-foreground">{activeConv.other_user.full_name}</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground text-sm">Начни переписку! 👋</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isMine = msg.sender_id === currentUserId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && <UserAvatar user={(msg as any).sender} size="xs" className="flex-shrink-0" />}
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine ? 'bg-neon-gradient text-white rounded-br-sm' : 'glass border border-white/10 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Написать сообщение..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 glass border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 rounded-full bg-neon-gradient flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">Твои сообщения</h2>
            <p className="text-muted-foreground text-sm">Найди пользователя и начни переписку</p>
          </div>
        )}
      </div>
    </div>
  )
}
