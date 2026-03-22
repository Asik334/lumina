'use client'

import { useEffect, useRef, useCallback } from 'react'
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
  // Стабилизируем onEvent через ref, чтобы не пересоздавать канал при каждом рендере
  const onEventRef = useRef(onEvent)
  useEffect(() => { onEventRef.current = onEvent }, [onEvent])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    // Убрали Date.now() — имя канала теперь стабильное, канал не дублируется
    const channelName = `realtime:${schema}:${table}:${filter || 'all'}:${event}`

    const config: any = { event, schema, table }
    if (filter) config.filter = filter

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', config, (payload) => onEventRef.current(payload))
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, schema, filter, event, enabled])
}

