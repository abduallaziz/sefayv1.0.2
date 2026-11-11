'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ApiError } from '@/lib/api'
import { useQuickDefinitions } from '../hooks/useQuickDefinitions'
import { useCreateFromQuick } from '../hooks/useExpensesCore'

interface Props {
  branchId: string
}

// Manual Quick Expense trigger (Step 5/10) — Fixed mode fires instantly on
// click (no input at all); Variable mode prompts for the amount only,
// matching the locked Fixed/Variable UX exactly.
export function QuickExpenseButtons({ branchId }: Props) {
  const t = useTranslations('expensesV2.expensesCore.quickButtons')
  const definitions = useQuickDefinitions()
  const createFromQuick = useCreateFromQuick(branchId)

  const [variablePromptId, setVariablePromptId] = useState<string | null>(null)
  const [variableAmount, setVariableAmount] = useState('')

  if (!definitions.data || definitions.data.length === 0) return null

  const handleClick = (definitionId: string, mode: 'fixed' | 'variable') => {
    if (mode === 'fixed') {
      createFromQuick.mutate(
        { definitionId, dto: {} },
        { onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed') },
      )
      return
    }
    setVariablePromptId(definitionId)
    setVariableAmount('')
  }

  const submitVariable = () => {
    const amount = parseFloat(variableAmount)
    if (!variablePromptId || isNaN(amount) || amount <= 0) return
    createFromQuick.mutate(
      { definitionId: variablePromptId, dto: { amount } },
      {
        onSuccess: () => setVariablePromptId(null),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
      },
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap className="h-3.5 w-3.5 text-posCloud-primary" />
        <span className="text-xs font-semibold text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
          {t('title')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {definitions.data.map((d) => (
          <Button
            key={d.id}
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={createFromQuick.isPending}
            onClick={() => handleClick(d.id, d.amount_mode)}
          >
            {d.label}
            {d.amount_mode === 'fixed' && d.fixed_amount != null && (
              <span className="tabular-nums text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {d.fixed_amount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {variablePromptId && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            autoFocus
            value={variableAmount}
            onChange={(e) => setVariableAmount(e.target.value)}
            placeholder={t('variableAmountPrompt')}
            className="w-40"
          />
          <Button size="sm" disabled={createFromQuick.isPending} onClick={submitVariable}>
            {t('confirm')}
          </Button>
        </div>
      )}
    </div>
  )
}
