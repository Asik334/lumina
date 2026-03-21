'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X, Upload, MapPin, Loader2, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

interface CreatePostModalProps {
  onClose: () => void
}

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'details'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStep('details')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleSubmit = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('Не удалось загрузить изображение. Попробуйте ещё раз.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim() || null,
        location: location.trim() || null,
      })

    if (postError) {
      setError('Не удалось создать публикацию. Попробуйте ещё раз.')
      setUploading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={step === 'details' ? () => { setStep('upload'); setFile(null); setPreview('') } : onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {step === 'details' ? 'Назад' : 'Отмена'}
            </button>
            <h2 className="font-semibold">Создать публикацию</h2>
            {step === 'details' ? (
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="text-neon-blue font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-1"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Опубликовать
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>

          {/* Content */}
          {step === 'upload' ? (
            <div
              {...getRootProps()}
              className={`aspect-square flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragActive ? 'bg-neon-purple/10' : 'hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                  isDragActive ? 'bg-neon-purple/20 scale-110' : 'bg-white/5'
                }`}>
                  <ImagePlus className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold mb-1">
                    {isDragActive ? 'Перетащите фото сюда' : 'Перетащите фото'}
                  </p>
                  <p className="text-sm text-muted-foreground">или нажмите для выбора</p>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP, GIF до 10 МБ</p>
                </div>
                <button className="px-6 py-2.5 rounded-xl bg-neon-gradient text-sm font-semibold hover:opacity-90 transition-opacity">
                  Выбрать с устройства
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="relative aspect-square bg-black">
                {preview && (
                  <Image src={preview} alt="Предпросмотр" fill className="object-contain" />
                )}
              </div>

              <div className="p-4 space-y-4">
                <textarea
                  placeholder="Добавьте подпись..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={2200}
                  className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none resize-none"
                />

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Добавить место"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
