'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Paperclip, Upload } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/shared/ui/sheet'
import { EmptyState } from '@/shared/ui/empty-state'
import { Button } from '@/shared/ui/button'
import { ATTACHMENT_ACCEPT, checkAttachment, displayAttachmentName } from '../lib/attachments'
import { useExpenseAttachments, useUploadAttachment } from '../hooks/useExpensesCore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  expenseId: string | null
}

export function ExpenseAttachmentsSheet({ open, onOpenChange, branchId, expenseId }: Props) {
  const t = useTranslations('expensesV2.expensesCore.attachmentsDrawer')
  const attachments = useExpenseAttachments(open ? branchId : undefined, open ? expenseId : null)
  const upload = useUploadAttachment(branchId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !expenseId) return
    const problem = checkAttachment(file)
    if (problem) {
      setError(problem === 'size' ? t('tooLarge', { name: file.name }) : t('unsupportedType', { name: file.name }))
      return
    }
    setError(null)
    upload.mutate({ expenseId, file })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} className="hidden" onChange={handleFileChange} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <Upload className="h-4 w-4" />
            {upload.isPending ? t('uploading') : t('upload')}
          </Button>

          {error && (
            <p role="alert" className="text-xs text-posCloud-danger">
              {error}
            </p>
          )}

          {!attachments.data || attachments.data.length === 0 ? (
            <EmptyState icon={Paperclip} title={t('empty')} theme="dashboard" size="sm" />
          ) : (
            <ul className="space-y-1">
              {attachments.data.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:bg-posCloud-sidebar dark:hover:bg-posCloudDark-background transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary shrink-0" />
                    <span className="truncate">{displayAttachmentName(a.storage_path)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
