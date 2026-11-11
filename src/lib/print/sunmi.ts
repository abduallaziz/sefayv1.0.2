import type { InvoicePrintPayload, KitchenPrintPayload, PrintLabels } from './types'

// OPTIONAL Sunmi driver (printing task T2) built on the documented "JS USDK"
// route: the Sunmi App Store plugin "JS USDK" exposes a local service that the
// `sunmi-js-sdk` browser bundle talks to (ws://localhost:7070).
//
// UNVERIFIED ON A REAL DEVICE. Written from the package type definitions
// (sunmi-js-sdk 1.0.53: SUNMI.launchPrinterService(), init(), printer.lineApi.*,
// class.TextStyle/BaseStyle/QrStyle). Open points that only a device test can
// settle: mixed content from an https page to ws://localhost, device-model
// support, Arabic shaping/RTL in lineApi (may need printBitmap), and silent
// auto-print. Until then it is OFF unless a `window.SUNMI` constructor is
// present (the JS bundle must be loaded by the host page / device browser);
// every failure falls back to browser printing, so enabling it cannot break
// printing. No npm dependency is added on purpose.

interface TextStyleLike {
  setAlign(a: unknown): TextStyleLike
  setEnableBold(b: boolean): TextStyleLike
  setTextSize(n: number): TextStyleLike
}
interface SunmiLike {
  printer: {
    lineApi: {
      initLine(s: unknown): void
      printText(text: string, style: unknown): void
      printTexts(text: string[], widths: number[], styles: unknown[]): void
      printQrCode(code: string, style: unknown): void
      printDividingLine(kind: unknown, offset: number): void
      autoOut(): void
    }
  } | null
  ENUM: { Align: Record<string, unknown>; DividingLine: Record<string, unknown> }
  class: {
    BaseStyle: { getStyle(): unknown }
    TextStyle: { getStyle(): TextStyleLike }
    QrStyle: { getStyle(): unknown }
  }
  launchPrinterService(): Promise<unknown>
  init(): void
}

declare global {
  interface Window {
    SUNMI?: new () => SunmiLike
  }
}

export function isSunmiBundlePresent(): boolean {
  return typeof window !== 'undefined' && typeof window.SUNMI === 'function'
}

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Returns true when printed by the Sunmi service, false when the caller must fall back. */
export async function printWithSunmi(
  payload: InvoicePrintPayload | KitchenPrintPayload,
  labels: PrintLabels,
): Promise<boolean> {
  if (!isSunmiBundlePresent()) return false
  try {
    const sunmi = new window.SUNMI!()
    await sunmi.launchPrinterService()
    sunmi.init()
    const api = sunmi.printer?.lineApi
    if (!api) return false

    const A = sunmi.ENUM.Align
    const style = (align: unknown, bold = false, size = 24) =>
      sunmi.class.TextStyle.getStyle().setAlign(align).setEnableBold(bold).setTextSize(size)
    api.initLine(sunmi.class.BaseStyle.getStyle())

    if (payload.kind === 'invoice') {
      api.printText(payload.business.name, style(A.CENTER, true, 30))
      if (payload.business.address) api.printText(payload.business.address, style(A.CENTER))
      if (payload.business.phone) api.printText(payload.business.phone, style(A.CENTER))
      if (payload.business.tax_number)
        api.printText(`${labels.receipt.taxNumber}: ${payload.business.tax_number}`, style(A.CENTER))
      api.printText(`${labels.receipt.invoice} #${payload.order_number}`, style(A.LEFT))
      api.printText(new Date(payload.created_at).toLocaleString('en-US'), style(A.LEFT))
      api.printDividingLine(sunmi.ENUM.DividingLine.DOTTED, 1)
      for (const it of payload.items) {
        api.printTexts(
          [it.variant_name ? `${it.name} (${it.variant_name})` : it.name, `${it.quantity}`, money(it.total)],
          [3, 1, 2],
          [style(A.LEFT), style(A.CENTER), style(A.RIGHT)],
        )
      }
      api.printDividingLine(sunmi.ENUM.DividingLine.DOTTED, 1)
      api.printTexts(
        [labels.receipt.total, `${money(payload.totals.total)} ${payload.currency_symbol}`],
        [1, 1],
        [style(A.LEFT, true), style(A.RIGHT, true)],
      )
      for (const p of payload.payments)
        api.printTexts(
          [labels.payment[p.method] ?? p.method, money(p.amount)],
          [1, 1],
          [style(A.LEFT), style(A.RIGHT)],
        )
      if (payload.change !== null && payload.change > 0)
        api.printTexts([labels.receipt.change, money(payload.change)], [1, 1], [style(A.LEFT), style(A.RIGHT)])
      if (payload.business.footer) api.printText(payload.business.footer, style(A.CENTER))
      if (payload.qr_base64) api.printQrCode(payload.qr_base64, sunmi.class.QrStyle.getStyle())
    } else {
      api.printText(payload.header_text || payload.business_name, style(A.CENTER, true, 30))
      api.printText(`${labels.kitchen.orderNumber} #${payload.order_number}`, style(A.LEFT, true))
      if (payload.table_name) api.printText(`${labels.kitchen.table}: ${payload.table_name}`, style(A.LEFT))
      if (payload.vehicle_plate) api.printText(`${labels.kitchen.car}: ${payload.vehicle_plate}`, style(A.LEFT))
      api.printDividingLine(sunmi.ENUM.DividingLine.DOTTED, 1)
      for (const it of payload.items)
        api.printText(`${it.quantity} x ${it.variant_name ? `${it.name} (${it.variant_name})` : it.name}`, style(A.LEFT, true, 28))
      if (payload.note) api.printText(`${labels.kitchen.notes}: ${payload.note}`, style(A.LEFT))
    }
    api.autoOut()
    return true
  } catch {
    return false
  }
}
