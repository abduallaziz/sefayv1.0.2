'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateGiftCard } from '../hooks/useGiftCards'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'

interface Props {
  onClose: () => void
}

export function IssueGiftCardModal({ onClose }: Props) {
  const t = useTranslations('giftCards')
  const { mutate: createGiftCard, isPending } = useCreateGiftCard()

  const [code, setCode] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!initialBalance) return
    setError(null)
    createGiftCard(
      {
        code: code.trim() || undefined,
        initial_balance: parseFloat(initialBalance),
        expires_at: expiresAt || undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">{t('issueGiftCard')}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('code')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('codeAutoGenerate')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('initialBalance')}</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('expiresAt')}</label>
            <SingleDatePicker value={expiresAt} onChange={setExpiresAt} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !initialBalance}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isPending ? t('saving') : t('issue')}
          </button>
        </div>
      </div>
    </div>
  )
}
