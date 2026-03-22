'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo } from '@/lib/utils'
import { Send, MessageCircle, PenSquare, ArrowLeft, Phone, Video } from 'lucide-react'
import NewChatModal from './NewChatModal'
import UserAvatar from '@/components/ui/UserAvatar'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
  // Мобильный режим: показываем либо список, либо чат
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Фикс высоты при открытии клавиатуры на Android/iOS
  useEffect(() => {
    const root = document.getElementById("mobile-chat-root")
    if (!root) return
    const setHeight = () => {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
      root.style.height = h + "px"
      root.style.minHeight = h + "px"
    }
    setHeight()
    if (window.visualViewport) window.visualViewport.addEventListener("resize", setHeight)
    window.addEventListener("resize", setHeight)
    return () => {
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", setHeight)
      window.removeEventListener("resize", setHeight)
    }
  }, [])

  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === chatId)
      if (conv) openConversation(conv)
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
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, sender: { id: newMsg.sender_id } }]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConv])

  const openConversation = (conv: any) => {
    setSelectedConv(conv)
    setMobileView('chat')
    // Фокус на инпут после открытия
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedConv(null)
  }

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

  const otherUser = selectedConv ? getOtherUser(selectedConv) : null

  return (
    <>
      {/* ─── ДЕСКТОП: два столбца ─── */}
      <div className="hidden md:flex h-[calc(100vh-4rem)] max-w-5xl mx-auto border border-white/10 rounded-2xl overflow-hidden glass">
        {/* Список бесед */}
        <div className="w-80 border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Сообщения</h2>
            <button onClick={() => setShowNewChat(true)} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
              <PenSquare className="w-5 h-5" />
            </button>
          </div>
          <ConvList conversations={conversations} selectedId={selectedConv?.id} currentUser={currentUser} onSelect={openConversation} onNewChat={() => setShowNewChat(true)} getOtherUser={getOtherUser} />
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <ChatArea
              messages={messages}
              currentUser={currentUser}
              otherUser={otherUser}
              newMessage={newMessage}
              sending={sending}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              onNewMessage={setNewMessage}
              onSend={handleSend}
              showBack={false}
              onBack={handleBack}
            />
          ) : (
            <EmptyChat onNewChat={() => setShowNewChat(true)} />
          )}
        </div>
      </div>

      {/* ─── МОБИЛЬНЫЙ: один экран ─── */}
      <div className="md:hidden flex flex-col" id="mobile-chat-root">
        {mobileView === 'list' ? (
          // Список
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
              <h1 className="font-bold text-xl">Сообщения</h1>
              <button onClick={() => setShowNewChat(true)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <PenSquare className="w-5 h-5" />
              </button>
            </div>
            <ConvList
              conversations={conversations}
              selectedId={selectedConv?.id}
              currentUser={currentUser}
              onSelect={openConversation}
              onNewChat={() => setShowNewChat(true)}
              getOtherUser={getOtherUser}
            />
          </div>
        ) : (
          // Чат — полный экран
          <ChatArea
            messages={messages}
            currentUser={currentUser}
            otherUser={otherUser}
            newMessage={newMessage}
            sending={sending}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
            onNewMessage={setNewMessage}
            onSend={handleSend}
            showBack={true}
            onBack={handleBack}
          />
        )}
      </div>

      {showNewChat && <NewChatModal currentUserId={currentUser.id} onClose={() => setShowNewChat(false)} />}
    </>
  )
}

// ─── Список бесед ───
function ConvList({ conversations, selectedId, currentUser, onSelect, onNewChat, getOtherUser }: any) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground p-6 text-center">
        <MessageCircle className="w-10 h-10 opacity-20" />
        <p className="text-sm">Нет сообщений</p>
        <button onClick={onNewChat} className="text-sm text-blue-400 hover:underline">Написать кому-нибудь</button>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv: any) => {
        const other = getOtherUser(conv)
        if (!other) return null
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left border-b border-white/5 ${selectedId === conv.id ? 'bg-white/10' : ''}`}
          >
            <UserAvatar user={other} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">@{other.username}</p>
              {conv.last_message && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
              )}
            </div>
            {conv.last_message_at && (
              <span className="text-xs text-muted-foreground flex-shrink-0 self-start mt-1">
                {formatTimeAgo(conv.last_message_at)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Область чата ───
function ChatArea({ messages, currentUser, otherUser, newMessage, sending, inputRef, messagesEndRef, onNewMessage, onSend, showBack, onBack }: any) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Шапка чата */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/10 glass flex-shrink-0"
        style={showBack ? { paddingTop: 'calc(env(safe-area-inset-top) + 12px)' } : {}}
      >
        {showBack && (
          <button onClick={onBack} className="mr-1 p-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {otherUser && (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar user={otherUser} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">@{otherUser.username}</p>
              {otherUser.full_name && <p className="text-xs text-muted-foreground truncate">{otherUser.full_name}</p>}
            </div>
          </Link>
        )}
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm">Начните переписку</p>
          </div>
        )}
        {messages.map((msg: any, i: number) => {
          const isMe = msg.sender_id === currentUser.id
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000
          return (
            <div key={msg.id || i}>
              {showTime && (
                <p className="text-center text-xs text-muted-foreground my-3">{formatTimeAgo(msg.created_at)}</p>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white/10 text-foreground rounded-bl-md'
                }`}>
                  <p style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-t border-white/10 glass flex-shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={e => onNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()} onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 400)}
          placeholder="Сообщение..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-all"
          style={{ fontSize: 16 }}
        />
        <button
          onClick={onSend}
          disabled={!newMessage.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Пустое состояние десктоп ───
function EmptyChat({ onNewChat }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <MessageCircle className="w-16 h-16 opacity-10" />
      <div className="text-center">
        <p className="font-semibold text-foreground">Ваши сообщения</p>
        <p className="text-sm mt-1">Выберите беседу или начните новую</p>
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <PenSquare className="w-4 h-4" />
        Новое сообщение
      </button>
    </div>
  )
}
