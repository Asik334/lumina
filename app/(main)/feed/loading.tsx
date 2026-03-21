import { PostSkeleton, StorySkeleton } from '@/components/ui/Skeleton'

export default function FeedLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex gap-8">
        <div className="flex-1 max-w-xl mx-auto xl:mx-0 space-y-6">
          {/* Stories skeleton */}
          <div className="glass rounded-2xl">
            <StorySkeleton />
          </div>
          {/* Post skeletons */}
          {[...Array(3)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
        {/* Sidebar skeleton */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 bg-white/10 rounded-full" />
                <div className="h-2.5 w-16 bg-white/5 rounded-full" />
              </div>
            </div>
            <div className="h-4 w-32 bg-white/5 rounded-full" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-white/10 rounded-full" />
                  <div className="h-2.5 w-28 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
