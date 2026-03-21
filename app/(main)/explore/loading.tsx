export default function ExploreLoading() {
  return (
    <div className="max-w-4xl mx-auto px-2 py-8">
      <div className="h-8 w-24 bg-white/10 rounded-full mb-6 mx-2 animate-pulse" />
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className={`bg-white/5 animate-pulse ${i % 7 === 0 ? 'col-span-2 row-span-2' : 'aspect-square'}`}
            style={{ aspectRatio: i % 7 === 0 ? '2/2' : '1/1' }}
          />
        ))}
      </div>
    </div>
  )
}
