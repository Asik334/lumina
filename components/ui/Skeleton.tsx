export function PostSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="h-2.5 w-16 bg-white/5 rounded-full" />
        </div>
        <div className="w-5 h-5 bg-white/10 rounded-full" />
      </div>

      {/* Image */}
      <div className="aspect-square bg-white/5" />

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="w-6 h-6 bg-white/10 rounded-full" />
          <div className="w-6 h-6 bg-white/10 rounded-full" />
          <div className="w-6 h-6 bg-white/10 rounded-full" />
        </div>
        <div className="h-3 w-20 bg-white/10 rounded-full" />
        <div className="h-3 w-64 bg-white/5 rounded-full" />
        <div className="h-3 w-32 bg-white/5 rounded-full" />
        <div className="h-2 w-16 bg-white/5 rounded-full" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-8 md:gap-16 items-start mb-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-6 w-32 bg-white/10 rounded-full" />
            <div className="h-8 w-24 bg-white/10 rounded-xl" />
          </div>
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 w-20 bg-white/10 rounded-full" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-white/10 rounded-full" />
            <div className="h-3 w-64 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

export function StorySkeleton() {
  return (
    <div className="flex gap-4 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-white/10" />
          <div className="h-2 w-12 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
          <div className={`h-10 rounded-2xl bg-white/10 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
        </div>
      ))}
    </div>
  )
}
