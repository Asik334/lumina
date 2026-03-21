'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  schema?: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onEvent: (payload: any) => void
  enabled?: boolean
}

export function useRealtime({
  table,
  schema = 'public',
  filter,
  event = '*',
  onEvent,
  enabled = true,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    const channelName = `realtime:${table}:${filter || 'all'}:${Date.now()}`

    const config: any = {
      event,
      schema,
      table,
    }
    if (filter) config.filter = filter

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', config, onEvent)
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, schema, filter, event, enabled])
}
