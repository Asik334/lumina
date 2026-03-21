'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export default function CreateStoryButton({ currentUserId }: { currentUserId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleCreate = async () => {
    if (!file || uploading) return
    setUploading(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${currentUserId}/${uuidv4()}.${fileExt}`

    const { error: uploadErr } = await supabase.storage
      .from('stories')
      .upload(fileName, file)

    if (uploadErr) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(fileName)

    await supabase.from('stories').insert({
      user_id: currentUserId,
      image_url: publicUrl,
      caption: caption.trim() || null,
    })

    router.refresh()
    setOpen(false)
    setFile(null)
    setPreview('')
    setCaption('')
    setUploading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-gradient text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Add Story
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass rounded-2xl border border-white/10 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="font-semibold">Add to Story</h2>
                <button onClick={() => setOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`aspect-[9/16] max-h-80 flex items-center justify-center cursor-pointer transition-all ${
                    isDragActive ? 'bg-neon-purple/10' : 'hover:bg-white/3'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-sm mb-1">Upload Story Image</p>
                    <p className="text-xs text-muted-foreground">Tap or drag to select</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[9/16] max-h-80 bg-black">
                  <Image src={preview} alt="Preview" fill className="object-contain" />
                </div>
              )}

              {preview && (
                <div className="p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none border-b border-white/10 pb-2"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={uploading}
                    className="w-full py-2.5 rounded-xl bg-neon-gradient text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? 'Uploading...' : 'Share Story'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
