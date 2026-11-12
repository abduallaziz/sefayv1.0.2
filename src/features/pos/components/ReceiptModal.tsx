'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { usePrinting } from '@/lib/print/usePrinting'
import { printApi } from '@/lib/print/print.api'
import { PaymentData } from '../types/pos.types'
import type { ReceiptLineItem } from '@/features/orders/types/order.types'
import { Button } from '@/shared/ui/button'
import { InvoiceNoteEditor } from './InvoiceNoteEditor'

interface Props {
  /** Authoritative line items from the order response — never the live
   *  cart preview, which can diverge from what was actually charged. */
  items: ReceiptLineItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  /** Informational only (which coupon was used / which tax mode applied) —
   *  not a financial figure, so sourcing this from the cart preview is safe. */
  couponCode?: string
  taxInclusive: boolean
  payment: PaymentData
  invoiceNumber: string
  /** Full order id - enables the post-sale note (G6). */
  orderId?: string
  taxRate: number
  total: number
  onNewOrder: () => void
}

export function ReceiptModal({
  items, subtotal, discountAmount, taxAmount, couponCode, taxInclusive,
  payment, invoiceNumber, orderId, taxRate, total, onNewOrder,
}: Props) {
  const t = useTranslations('pos')
  const now = new Date().toLocaleString('en-US')
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const taxPct = `${(taxRate * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`

  const paymentLabel = {
    cash: t('payment.cash'),
    card: t('payment.card'),
    split: t('receipt.methodSplit'),
    mada: t('payment.mada'),
    visa: t('payment.visa'),
    mastercard: t('payment.mastercard'),
    wallet: t('payment.wallet'),
    apple_pay: t('payment.applePay'),
    stc_pay: t('payment.stcPay'),
    tab: t('payment.card'),
  }[payment.method]

  const tPrint = useTranslations('print.actions')
  const { print, printKitchen } = usePrinting()
  const [printing, setPrinting] = useState(false)
  const autoPrintStarted = useRef(false)
  const tendered = payment.method === 'cash' ? payment.cash_tendered : undefined

  // One path for the manual button and for tenants.printer_settings.auto_print:
  // fetch the server payload, print it, then return to the product list.
  const printAndFinish = async () => {
    if (!orderId) return
    setPrinting(true)
    try {
      await print(await printApi.invoicePayload(orderId, tendered))
      onNewOrder()
    } catch {
      toast.error(tPrint('printFailed'))
      setPrinting(false)
    }
  }

  const printKitchenTicket = async () => {
    if (!orderId) return
    try {
      await printKitchen(orderId)
    } catch {
      toast.error(tPrint('kitchenFailed'))
    }
  }

  useEffect(() => {
    if (autoPrintStarted.current || !orderId) return
    autoPrintStarted.current = true
    let cancelled = false
    printApi
      .invoicePayload(orderId, tendered)
      .then(async (payload) => {
        if (cancelled || !payload.auto_print) return
        setPrinting(true)
        await print(payload)
        onNewOrder()
      })
      .catch(() => {
        if (!cancelled) {
          setPrinting(false)
          toast.error(tPrint('printFailed'))
        }
      })
    return () => {
      cancelled = true
    }
    // runs once per receipt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
      {/* Bounded to the viewport (max-h-[85vh]) so long orders never push the
          buttons off-screen. Only the item list scrolls internally — header,
          totals, and payment info stay put, and the action buttons are a
          sticky footer, never covered or pushed out of reach. */}
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-posCloud-border bg-posCloud-surface shadow-xl dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
        <div className="shrink-0 px-5 pt-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-posCloud-success-light dark:bg-posCloud-success/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-posCloud-success" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-xl text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('receipt.success')}</h3>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1">{t('receipt.invoiceNumber', { number: invoiceNumber })}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{now}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="border-t border-dashed border-posCloud-border dark:border-posCloudDark-border py-3 space-y-1.5">
            {items.map((item, i) => (
              <div key={`${item.item_id}-${item.variant_id ?? ''}-${i}`} className="flex justify-between text-sm">
                <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {item.item_name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                </span>
                <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{fmt(item.quantity * item.unit_price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 pb-3">
          <div className="border-t border-dashed border-posCloud-border dark:border-posCloudDark-border py-3 space-y-1.5 text-sm">
            <div className="flex justify-end">
              <span className="rounded-full bg-posCloud-background dark:bg-posCloudDark-background px-2 py-0.5 text-[10px] font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                {taxInclusive ? t('taxMode.inclusive') : t('taxMode.exclusive')}
              </span>
            </div>
            <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{t('subtotal')}</span><span>{fmt(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-posCloud-success">
                <span>{t('discount')}{couponCode ? ` (${couponCode})` : ''}</span>
                <span>−{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{t('receipt.taxLabel', { percent: taxPct })}</span><span>{fmt(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-posCloud-border dark:border-posCloudDark-border pt-2">
              <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('total')}</span>
              <span className="text-posCloud-primary">{fmt(total)} {t('receipt.currency')}</span>
            </div>
          </div>

          <div className="bg-posCloud-background dark:bg-posCloudDark-background rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('receipt.paymentMethod')}</span>
              <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{paymentLabel}</span>
            </div>
            {payment.method === 'cash' && payment.change !== undefined && payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('receipt.change')}</span>
                <span className="font-medium text-posCloud-success">{fmt(payment.change)} {t('receipt.currency')}</span>
              </div>
            )}
          </div>

          {orderId && (
            <div className="mt-3">
              <InvoiceNoteEditor orderId={orderId} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-posCloud-border dark:border-posCloudDark-border p-3">
          <Button variant="outline" onClick={printKitchenTicket} disabled={printing || !orderId} className="rounded-xl">
            {tPrint('kitchen')}
          </Button>
          <Button variant="outline" onClick={printAndFinish} disabled={printing || !orderId} className="flex-1 rounded-xl">
            {printing ? tPrint('printing') : t('receipt.printButton')}
          </Button>
          <Button onClick={onNewOrder} className="flex-1 rounded-xl font-bold">
            {t('receipt.newOrder')}
          </Button>
        </div>
      </div>
    </div>
  )
}
