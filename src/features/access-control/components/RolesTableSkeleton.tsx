import { Skeleton } from '@/shared/ui'

const WIDTH_CLASSES = ['w-[35%]', 'w-[15%]', 'w-[15%]', 'w-[20%]', 'w-[15%]']

export function RolesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-6 border-b border-slate-200 bg-slate-50/75 px-6 py-3">
        {WIDTH_CLASSES.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex h-14 items-center gap-6 px-6">
            {WIDTH_CLASSES.map((w, colIndex) => (
              <Skeleton key={colIndex} className={`h-4 ${w}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
