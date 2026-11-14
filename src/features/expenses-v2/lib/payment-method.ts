'use client'

import { useTranslations } from 'next-intl'

export type PaymentMethodCode = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other'

const ALIASES: Record<string, PaymentMethodCode> = {
  cash: 'cash',
  card: 'card',
  credit_card: 'card',
  debit_card: 'card',
  mada: 'card',
  transfer: 'bank_transfer',
  bank: 'bank_transfer',
  bank_transfer: 'bank_transfer',
  banktransfer: 'bank_transfer',
  wire: 'bank_transfer',
  cheque: 'cheque',
  check: 'cheque',
  other: 'other',
}

const LABEL_KEYS: Record<PaymentMethodCode, string> = {
  cash: 'paymentMethodCash',
  card: 'paymentMethodCard',
  bank_transfer: 'paymentMethodBankTransfer',
  cheque: 'paymentMethodCheque',
  other: 'paymentMethodOther',
}

/**
 * Maps whatever was stored as a payment method ("Cash", "transfer", "bank transfer", "cash"...) to one
 * canonical code, case-insensitively. Returns null when the value is not a known code.
 */
export function normalizePaymentMethod(raw: string | null | undefined): PaymentMethodCode | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return ALIASES[key] ?? null
}

/** Display name for a stored payment method; a raw code is never shown. */
export function usePaymentMethodLabel() {
  const t = useTranslations('expensesV2.expensesCore.form')
  return (raw: string | null | undefined): string => {
    if (!raw) return '—'
    const code = normalizePaymentMethod(raw)
    if (code) return t(LABEL_KEYS[code] as never)
    // Free text written in a human language (e.g. Arabic) is already a label; a latin code-like value is not.
    return /^[a-z0-9_\- ]+$/i.test(raw.trim()) ? t(LABEL_KEYS.other as never) : raw
  }
}
