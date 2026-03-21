import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint can be called by Vercel Cron Jobs to clean up expired stories
// Add to vercel.json: { "crons": [{ "path": "/api/stories/cleanup", "schedule": "0 * * * *" }] }
export async function GET(request: NextRequest) {
  // Simple auth via secret header for cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  // Get expired stories to delete their storage files
  const { data: expiredStories } = await supabase
    .from('stories')
    .select('id, image_url')
    .lt('expires_at', new Date().toISOString())

  if (expiredStories && expiredStories.length > 0) {
    // Extract storage paths
    const storagePaths = expiredStories
      .map(s => {
        const parts = s.image_url.split('/stories/')
        return parts[1] || null
      })
      .filter(Boolean) as string[]

    // Delete from storage
    if (storagePaths.length > 0) {
      await supabase.storage.from('stories').remove(storagePaths)
    }

    // Delete from DB
    await supabase
      .from('stories')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }

  return NextResponse.json({
    success: true,
    deleted: expiredStories?.length || 0,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()

  const { data: stories } = await supabase
    .from('stories')
    .select('*, user:users(*)')
    .eq('user_id', userId || user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })

  return NextResponse.json({ stories: stories || [] })
}
