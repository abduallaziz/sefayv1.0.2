'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { NumberInput } from '@/shared/ui/number-input/NumberInput'
import { DialogShell } from '@/features/tables/components/DialogShell'
import { SimpleSelect } from '@/features/tables/components/SimpleSelect'
import { useCatalogItems } from '@/features/items/hooks/useItems'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'
import { createOrder } from '@/features/orders/api/orders.api'
import { useLinkWashOrder, useChangeWashStatus } from '../hooks/useQueue'
import type { WashJob } from '../api/queue.api'

const MAX_PRICE = 1_000_000
const FIELD =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white'

interface Props {
  job: WashJob
  branchId: string
  onClose: () => void
}

/**
 * Bills a wash job when the car is handed over (B-21): creates a normal invoice through the
 * existing invoices API, stores its id on the queue entry, then marks the job delivered.
 */
export function WashChargeDialog({ job, branchId, onClose }: Props) {
  const t = useTranslations('queue')
  const currency = useCurrencyDisplay()
  const { items, isLoading: itemsLoading } = useCatalogItems()
  const { data: shift } = useCurrentShift()
  const link = useLinkWashOrder()
  const [itemId, setItemId] = useState('')
  const [price, setPrice] = useState('')
  const [method, setMethod] = useState<'cash' | 'card'>('cash')
  const [tendered, setTendered] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // one sale attempt per dialog, and the invoice survives a failed follow-up step (never charge twice)
  const attemptId = useRef<string>(crypto.randomUUID())
  const createdOrderId = useRef<string | null>(null)
  const lock = useRef(false)
  const [hasInvoice, setHasInvoice] = useState(false)

  const onStatusError = () => undefined
  const change = useChangeWashStatus(onStatusError)

  const fail = (e: unknown) => setError(e instanceof ApiError && e.message ? e.message : t('errors.action'))

  const services = useMemo(() => {
    const active = items.filter((i) => i.is_active && !i.has_variants)
    const svc = active.filter((i) => i.type === 'service' || i.category_type === 'service')
    return svc.length > 0 ? svc : active
  }, [items])

  const amount = price === '' ? null : Number(price)
  const priceValid = amount !== null && Number.isFinite(amount) && amount > 0 && amount <= MAX_PRICE
  const tenderedNum = tendered === '' ? null : Number(tendered)
  const cashValid = method === 'card' || (tenderedNum !== null && Number.isFinite(tenderedNum) && tenderedNum > 0)
  const valid = !!itemId && priceValid && cashValid

  const pickItem = (id: string) => {
    setItemId(id)
    const it = services.find((x) => x.id === id)
    if (it) {
      setPrice(String(it.price))
      setTendered(String(it.price))
    }
  }

  const finishDelivery = (orderId: string) => {
    link.mutate(
      { id: job.id, orderId },
      {
        onSuccess: () =>
          change.mutate(
            { id: job.id, status: 'delivered' },
            {
              onSuccess: () => {
                toast.success(t('charge.done'))
                onClose()
              },
              onError: (e: unknown) => fail(e),
              onSettled: () => {
                lock.current = false
                setBusy(false)
              },
            },
          ),
        onError: (e: unknown) => {
          fail(e)
          lock.current = false
          setBusy(false)
        },
      },
    )
  }

  const submit = async () => {
    if (lock.current || !valid || amount === null) return
    const it = services.find((x) => x.id === itemId)
    if (!it) return
    lock.current = true
    setBusy(true)
    setError(null)
    try {
      let orderId = createdOrderId.current
      if (!orderId) {
        const order = await createOrder({
          branch_id: branchId,
          shift_id: shift?.id,
          sale_attempt_id: attemptId.current,
          payment_method: method,
          cash_tendered: method === 'cash' ? (tenderedNum as number) : undefined,
          notes: `${t('title')}: ${job.plate}`,
          items: [{ item_id: it.id, item_name: it.name, quantity: 1, unit_price: amount }],
        })
        orderId = order.id
        createdOrderId.current = order.id
        setHasInvoice(true)
      }
      finishDelivery(orderId)
    } catch (e) {
      fail(e)
      lock.current = false
      setBusy(false)
    }
  }

  const deliverWithoutInvoice = () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    change.mutate(
      { id: job.id, status: 'delivered' },
      {
        onSuccess: () => onClose(),
        onError: (e: unknown) => fail(e),
        onSettled: () => {
          lock.current = false
          setBusy(false)
        },
      },
    )
  }

  return (
    <DialogShell title={`${t('charge.title')} · ${job.plate}`} onClose={onClose} busy={busy}>
      <div className="space-y-3 overflow-y-auto p-5">
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('charge.service')}</label>
          <SimpleSelect
            value={itemId}
            onChange={pickItem}
            placeholder={itemsLoading ? t('charge.loading') : t('charge.selectService')}
            ariaLabel={t('charge.service')}
            options={services.map((s) => ({ value: s.id, label: `${s.name} (${s.price} ${currency})` }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('charge.price')} ({currency})</label>
          <NumberInput value={price} onChange={setPrice} maxLength={9} aria-invalid={price !== '' && !priceValid} className={FIELD} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t('charge.method')}</label>
          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'card'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`rounded-lg border py-2 text-sm font-medium ${
                  method === m
                    ? 'border-[#0C447C] bg-[#0C447C] text-white'
                    : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`charge.${m}`)}
              </button>
            ))}
          </div>
        </div>
        {method === 'cash' && (
          <div>
            <label className="mb-1 block text-xs text-gray-500">{t('charge.tendered')} ({currency})</label>
            <NumberInput value={tendered} onChange={setTendered} maxLength={9} className={FIELD} />
          </div>
        )}
        {!shift && <p className="text-xs text-amber-600">{t('charge.noShift')}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex flex-col gap-2 border-t border-gray-200 p-5 dark:border-gray-700">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !valid}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? t('charge.processing') : t('charge.confirm')}
        </button>
        <button
          type="button"
          onClick={deliverWithoutInvoice}
          disabled={busy || hasInvoice}
          className="w-full rounded-xl border border-gray-200 py-2 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          {t('charge.skip')}
        </button>
      </div>
    </DialogShell>
  )
}
