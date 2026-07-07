'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface SimpleAdvancedToggleProps {
  advanced: boolean
  onChange: (advanced: boolean) => void
}

export function SimpleAdvancedToggle({ advanced, onChange }: SimpleAdvancedToggleProps) {
  const t = useTranslations('accessControl')

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          !advanced
            ? 'bg-white dark:bg-gray-900 text-[#0C447C] dark:text-[#5B9BD5] shadow-sm'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {t('simpleMode')}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          advanced
            ? 'bg-white dark:bg-gray-900 text-[#0C447C] dark:text-[#5B9BD5] shadow-sm'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {t('advancedMode')}
      </button>
    </div>
  )
}
