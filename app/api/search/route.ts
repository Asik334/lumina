import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'all'

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ users: [], posts: [] })
  }

  const results: { users?: any[]; posts?: any[] } = {}

  if (type === 'all' || type === 'users') {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10)
    results.users = users || []
  }

  if (type === 'all' || type === 'posts') {
    const { data: posts } = await supabase
      .from('posts')
      .select('*, user:users(*)')
      .ilike('caption', `%${q}%`)
      .order('likes_count', { ascending: false })
      .limit(12)
    results.posts = posts || []
  }

  return NextResponse.json(results)
}
