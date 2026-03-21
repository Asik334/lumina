'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/ui/UserAvatar'
import { v4 as uuidv4 } from 'uuid'
import type { User } from '@/types'

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', authUser.id).single()

      if (profile) {
        setUser(profile)
        setFullName(profile.full_name || '')
        setUsername(profile.username || '')
        setBio(profile.bio || '')
        setWebsite(profile.website || '')
      }
    }
    fetchUser()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    let avatarUrl = user?.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${authUser.id}/${uuidv4()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl
      }
    }

    if (username !== user?.username) {
      const { data: existing } = await supabase
        .from('users').select('id').eq('username', username).neq('id', authUser.id).single()
      if (existing) { setError('Это имя пользователя уже занято'); setSaving(false); return }
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq('id', authUser.id)

    if (updateErr) { setError(updateErr.message); setSaving(false); return }

    setSuccess(true)
    setTimeout(() => {
      router.push(`/profile/${username.trim().toLowerCase()}`)
    }, 1000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const fields = [
    { label: 'Полное имя', value: fullName, setter: setFullName, placeholder: 'Ваше полное имя' },
    { label: 'Имя пользователя', value: username, setter: setUsername, placeholder: 'username', transform: (v: string) => v.toLowerCase() },
    { label: 'Сайт', value: website, setter: setWebsite, placeholder: 'https://yourwebsite.com' },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Редактировать профиль</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <UserAvatar
              user={avatarPreview ? { ...user, avatar_url: avatarPreview } : user}
              size="xl"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-semibold">{user.username}</p>
            <label className="text-sm text-neon-blue cursor-pointer hover:opacity-80 transition-opacity">
              Изменить фото профиля
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
        </div>

        {fields.map(({ label, value, setter, placeholder, transform }) => (
          <div key={label}>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground">{label}</label>
            <input
              type="text"
              value={value}
              onChange={e => setter(transform ? transform(e.target.value) : e.target.value)}
              placeholder={placeholder}
              className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold mb-2 text-muted-foreground">О себе</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Расскажите немного о себе..."
            maxLength={150}
            rows={3}
            className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-purple/50 transition-all placeholder:text-muted-foreground resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/150</p>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
          >
            {error}
          </motion.p>
        )}

        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3"
          >
            Профиль обновлён! Перенаправление...
          </motion.p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl glass border border-white/10 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-neon-gradient text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}
