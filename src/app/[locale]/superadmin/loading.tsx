export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-slate-200 dark:bg-[#141720] rounded-lg animate-pulse" />
      <div className="h-4 w-72 bg-slate-200 dark:bg-[#141720] rounded animate-pulse" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-[#141720] rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-slate-200 dark:bg-[#141720] rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-[#141720] rounded-xl animate-pulse" />
      </div>

      <div className="h-48 bg-slate-200 dark:bg-[#141720] rounded-xl animate-pulse" />
    </div>
  )
}
