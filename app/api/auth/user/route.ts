import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const id = searchParams.get('id')

  if (!username && !id) {
    return NextResponse.json({ error: 'username or id required' }, { status: 400 })
  }

  let query = supabase.from('users').select('*')
  if (username) query = query.eq('username', username)
  if (id) query = query.eq('id', id)

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['full_name', 'username', 'bio', 'website', 'avatar_url', 'is_private']
  const updates: Record<string, any> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (updates.username) {
    // Check uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', updates.username)
      .neq('id', user.id)
      .single()

    if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ user: data })
}
