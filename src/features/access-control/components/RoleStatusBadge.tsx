import { Lock, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/shared/ui'
import { cn } from '@/lib/utils'

export function RoleStatusBadge({ isSystem, className }: { isSystem: boolean; className?: string }) {
  const t = useTranslations('accessControl')

  if (isSystem) {
    return (
      <Badge
        className={cn(
          'gap-1 border border-slate-200 bg-slate-100 py-0.5 px-2 text-xs font-medium text-slate-800 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200',
          className,
        )}
      >
        <Lock className="h-3 w-3" /> {t('roleScope.system')}
      </Badge>
    )
  }
  return (
    <Badge
      className={cn(
        'gap-1 border border-indigo-100 bg-indigo-50 py-0.5 px-2 text-xs font-medium text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
        className,
      )}
    >
      <Globe className="h-3 w-3" /> {t('roleScope.custom')}
    </Badge>
  )
}
