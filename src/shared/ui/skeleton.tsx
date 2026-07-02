import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  theme?: 'superadmin' | 'dashboard';
}

export function Skeleton({ className, theme = 'dashboard' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        theme === 'superadmin' ? 'bg-[#1e2436]' : 'bg-[#f1f5f9]',
        className
      )}
    />
  );
}

// Preset skeletons
export function StatCardSkeleton({ theme = 'dashboard' }: { theme?: 'superadmin' | 'dashboard' }) {
  const bg = theme === 'superadmin' ? 'bg-[#1a1f2e] border-[#1e2130]' : 'bg-white border-[#e2e8f0]';
  return (
    <div className={cn('rounded-xl border p-5', bg)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton theme={theme} className="h-3 w-24" />
          <Skeleton theme={theme} className="h-7 w-32 mt-2" />
          <Skeleton theme={theme} className="h-3 w-20 mt-2" />
        </div>
        <Skeleton theme={theme} className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5, theme = 'dashboard' }: { cols?: number; theme?: 'superadmin' | 'dashboard' }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} theme={theme} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </>
  );
}