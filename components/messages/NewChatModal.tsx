'use client'
// components/messages/NewChatModal.tsx
// РљРѕРјРїРѕРЅРµРЅС‚ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РЅРѕРІРѕРіРѕ С‡Р°С‚Р°

import { useState } from 'react'
import { X, Search, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
}

interface NewChatModalProps {
  currentUserId: string
  onClose: () => void
}

export default function NewChatModal({ currentUserId, onClose }: NewChatModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .neq('id', currentUserId)
      .or(`username.ilike.%${value}%,full_name.ilike.%${value}%`)
      .limit(10)

    setResults(data || [])
    setLoading(false)
  }

  const handleStartChat = async (targetUser: User) => {
    setStarting(targetUser.id)

    // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р»Рё СѓР¶Рµ С‡Р°С‚ РјРµР¶РґСѓ СЌС‚РёРјРё РґРІСѓРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${currentUserId})`
      )
      .single()

    if (existingConversation) {
      // Р§Р°С‚ СѓР¶Рµ РµСЃС‚СЊ вЂ” РїСЂРѕСЃС‚Рѕ РѕС‚РєСЂС‹РІР°РµРј РµРіРѕ
      router.push(`/messages?chat=${existingConversation.id}`)
      onClose()
      return
    }

    // РЎРѕР·РґР°С‘Рј РЅРѕРІС‹Р№ С‡Р°С‚
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: currentUserId,
        user2_id: targetUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ С‡Р°С‚Р°:', error)
      // Р•СЃР»Рё С‚Р°Р±Р»РёС†С‹ conversations РЅРµС‚ вЂ” РїСЂРѕР±СѓРµРј С‡РµСЂРµР· messages РЅР°РїСЂСЏРјСѓСЋ
      router.push(`/messages?user=${targetUser.id}`)
      onClose()
      return
    }

    router.push(`/messages?chat=${newConversation.id}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
            <h2 className="font-semibold text-lg">РќРѕРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="РџРѕРёСЃРє РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-neon-blue/50 focus:bg-white/8 transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Р’РІРµРґРёС‚Рµ РёРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">РџРѕР»СЊР·РѕРІР°С‚РµР»Рё РЅРµ РЅР°Р№РґРµРЅС‹</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  disabled={starting === user.id}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                >
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">@{user.username}</p>
                    {user.full_name && (
                      <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                    )}
                  </div>
                  {starting === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

