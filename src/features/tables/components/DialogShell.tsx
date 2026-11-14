'use client'

import { useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  /** While true Escape / backdrop / X do nothing (a write is in flight). */
  busy?: boolean
  maxWidth?: string
  children: ReactNode
}

/** Accessible modal frame: role=dialog, Escape + backdrop close, labelled close button. */
export function DialogShell({ title, onClose, busy = false, maxWidth = 'max-w-sm', children }: Props) {
  const t = useTranslations('tables')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={() => !busy && onClose()} />
      <div className={`relative w-full ${maxWidth} max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900`}>
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            aria-label={t('close')}
            title={t('close')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
