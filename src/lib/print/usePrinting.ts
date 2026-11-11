'use client'

import { useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { printApi } from './print.api'
import { printReceipt } from './printReceipt'
import type { PrintLabels, PrintPayload, RenderOptions } from './types'

/** Translated words for the ticket renderer (namespace `print`). */
export function usePrintLabels(): PrintLabels {
  const t = useTranslations('print')
  return useMemo(
    () => ({
      receipt: t.raw('receipt') as PrintLabels['receipt'],
      payment: t.raw('payment') as PrintLabels['payment'],
      kitchen: t.raw('kitchen') as PrintLabels['kitchen'],
    }),
    [t],
  )
}

export function useRenderOptions(): RenderOptions {
  const locale = useLocale()
  return useMemo<RenderOptions>(
    () => ({ lang: locale, dir: locale === 'ar' ? 'rtl' : 'ltr' }),
    [locale],
  )
}

/**
 * Per-device choice (this browser only): set localStorage `sefay.print.driver`
 * to `sunmi` on a Sunmi terminal to try the Sunmi driver first. UNVERIFIED on
 * a real device; any Sunmi failure falls back to browser printing.
 */
function readSunmiDeviceChoice(): boolean {
  try {
    return window.localStorage.getItem('sefay.print.driver') === 'sunmi'
  } catch {
    return false
  }
}

/**
 * Fetches the server print payload and prints it through printReceipt().
 * Throws on failure so the caller can show its own (translated) error.
 */
export function usePrinting(opts: { preferSunmi?: boolean } = {}) {
  const labels = usePrintLabels()
  const render = useRenderOptions()
  const preferSunmi = opts.preferSunmi ?? readSunmiDeviceChoice()

  const print = useCallback(
    (payload: PrintPayload) => printReceipt(payload, labels, { ...render, preferSunmi }),
    [labels, render, preferSunmi],
  )
  const printInvoice = useCallback(
    async (orderId: string, tendered?: number) => print(await printApi.invoicePayload(orderId, tendered)),
    [print],
  )
  const printKitchen = useCallback(
    async (orderId: string, all = false) => print(await printApi.kitchenPayload(orderId, all)),
    [print],
  )
  return { labels, render, print, printInvoice, printKitchen }
}
