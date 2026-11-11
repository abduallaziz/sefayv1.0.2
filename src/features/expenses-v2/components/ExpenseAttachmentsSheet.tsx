'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Paperclip, Upload } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/shared/ui/sheet'
import { EmptyState } from '@/shared/ui/empty-state'
import { Button } from '@/shared/ui/button'
import { ApiError } from '@/lib/api'
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !expenseId) return
    upload.mutate(
      { expenseId, file },
      {
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Upload failed'),
      },
    )
    e.target.value = ''
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <Upload className="h-4 w-4" />
            {upload.isPending ? t('uploading') : t('upload')}
          </Button>

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
                    <span className="truncate">{a.storage_path.split('/').pop()}</span>
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
