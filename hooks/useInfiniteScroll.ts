'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<T[]>
  initialData?: T[]
  pageSize?: number
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialData = [],
  pageSize = 10,
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const nextPage = page + 1
    const newData = await fetchFn(nextPage)

    if (newData.length < pageSize) {
      setHasMore(false)
    }

    setData(prev => [...prev, ...newData])
    setPage(nextPage)
    setLoading(false)
  }, [page, loading, hasMore, fetchFn, pageSize])

  useEffect(() => {
    if (!sentinelRef.current) return

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore])

  return { data, setData, loading, hasMore, sentinelRef }
}
