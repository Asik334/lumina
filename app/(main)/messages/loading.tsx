import { MessageSkeleton } from '@/components/ui/Skeleton'

export default function MessagesLoading() {
  return (
    <div className="flex h-screen animate-pulse">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-white/5 p-4 space-y-4">
        <div className="h-6 w-24 bg-white/10 rounded-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-white/10 rounded-full" />
              <div className="h-2.5 w-40 bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div className="hidden md:flex flex-col flex-1">
        <MessageSkeleton />
      </div>
    </div>
  )
}
