'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, Flag, Link as LinkIcon, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deletePost } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/useToast'

interface PostOptionsMenuProps {
  postId: string
  postOwnerId: string
  currentUserId: string
}

export default function PostOptionsMenu({ postId, postOwnerId, currentUserId }: PostOptionsMenuProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const isOwner = postOwnerId === currentUserId

  const handleDelete = async () => {
    if (!confirm('Удалить публикацию? Это действие необратимо.')) return
    setDeleting(true)

    const result = await deletePost(postId)
    if (result.error) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' as any })
    } else {
      toast({ title: 'Публикация удалена' })
      router.refresh()
    }
    setDeleting(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`)
    toast({ title: 'Ссылка скопирована!' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5">
          {deleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MoreHorizontal className="w-5 h-5" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="w-4 h-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        {isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete post
            </DropdownMenuItem>
          </>
        )}
        {!isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
