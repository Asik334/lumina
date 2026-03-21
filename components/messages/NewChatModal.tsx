'use client'
import { useState } from 'react'
import { X, Search, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { useRouter } from 'next/navigation'

interface Props { currentUserId: string; onClose: () => void }

export default function NewChatModal({ currentUserId, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase.from('users').select('*')
      .neq('id', currentUserId).or(`username.ilike.%${value}%,full_name.ilike.%${value}%`).limit(10)
    setResults((data as User[]) || [])
    setLoading(false)
  }

  const handleStartChat = async (targetUser: User) => {
    setStarting(targetUser.id)
    const { data: existing } = await supabase.from('conversations').select('id')
      .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${targetUser.id}),and(participant_1.eq.${targetUser.id},participant_2.eq.${currentUserId})`).single()
    if (existing) { router.push(`/messages?chat=${existing.id}`); onClose(); return }
    const { data: newConv } = await supabase.from('conversations')
      .insert({ participant_1: currentUserId, participant_2: targetUser.id }).select('id').single()
    router.push(newConv ? `/messages?chat=${newConv.id}` : `/messages?user=${targetUser.id}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-lg">Новое сообщение</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Поиск пользователей..." value={query}
              onChange={e => handleSearch(e.target.value)} autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-blue-400/50 transition-all" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {query.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">Введите имя пользователя</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12"><p className="text-sm text-muted-foreground">Не найдено</p></div>
          ) : (
            <div className="divide-y divide-white/5">
              {results.map(user => (
                <button key={user.id} onClick={() => handleStartChat(user)} disabled={starting === user.id}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left disabled:opacity-50">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">@{user.username}</p>
                    {user.full_name && <p className="text-xs text-muted-foreground">{user.full_name}</p>}
                  </div>
                  {starting === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4 text-muted-foreground" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
