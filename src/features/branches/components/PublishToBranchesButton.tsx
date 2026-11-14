'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Share2 } from 'lucide-react'
import { PublishToBranchesDialog } from './PublishToBranchesDialog'
import { useCanPublishToBranches } from '../hooks/useCanPublish'

interface Props {
  entityType: string
  ids: string[]
  className?: string
}

/** Button + dialog; renders nothing unless the user is central, isolation is on and there is more than one branch. */
export function PublishToBranchesButton({ entityType, ids, className }: Props) {
  const tb = useTranslations('branches')
  const canPublish = useCanPublishToBranches()
  const [open, setOpen] = useState(false)
  if (!canPublish || ids.length === 0) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tb('publishAction')}
        title={tb('publishAction')}
        className={
          className ??
          'inline-flex items-center gap-1.5 text-sm font-medium text-[#0C447C] dark:text-[#5B9BD5] hover:underline'
        }
      >
        <Share2 className="w-4 h-4" />
        {tb('publishAction')}
      </button>
      <PublishToBranchesDialog open={open} onOpenChange={setOpen} entityType={entityType} sourceIds={ids} />
    </>
  )
}
