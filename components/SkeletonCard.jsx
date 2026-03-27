export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="bg-gray-200 aspect-square" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mt-4" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
