import { renderPrintHtml } from './renderReceipt'
import { printWithSunmi } from './sunmi'
import type { PrintLabels, PrintPayload, RenderOptions } from './types'

// The single print entry point for the web POS (printing tasks T1-T3).
// Driver order: Sunmi (only when its JS bundle is present AND the caller
// allows it) -> browser print through a hidden iframe. The iframe carries the
// ticket's own @page/print CSS, so the app's page is never printed by mistake.

export type PrintDriver = 'sunmi' | 'browser'

export interface PrintOptions extends RenderOptions {
  /** Try the Sunmi service first. Off by default (UNVERIFIED on a device). */
  preferSunmi?: boolean
}

function waitForImages(doc: Document, timeoutMs = 4000): Promise<void> {
  const imgs = Array.from(doc.images).filter((i) => !i.complete)
  if (!imgs.length) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    let left = imgs.length
    const one = () => {
      if (--left <= 0) done()
    }
    imgs.forEach((i) => {
      i.addEventListener('load', one, { once: true })
      i.addEventListener('error', one, { once: true })
    })
    setTimeout(done, timeoutMs)
  })
}

/** Prints an already rendered document through a hidden iframe. */
export function printHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      setTimeout(() => iframe.remove(), 1000)
    }
    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow
        const doc = iframe.contentDocument
        if (!win || !doc) throw new Error('print frame unavailable')
        await waitForImages(doc)
        win.addEventListener('afterprint', cleanup, { once: true })
        win.focus()
        win.print()
        resolve()
        // Some browsers never fire afterprint inside an iframe.
        setTimeout(cleanup, 60_000)
      } catch (e) {
        cleanup()
        reject(e)
      }
    }
    iframe.srcdoc = html
    document.body.appendChild(iframe)
  })
}

export async function printReceipt(
  payload: PrintPayload,
  labels: PrintLabels,
  options: PrintOptions,
): Promise<PrintDriver> {
  if (options.preferSunmi && (await printWithSunmi(payload, labels))) return 'sunmi'
  await printHtml(renderPrintHtml(payload, labels, options))
  return 'browser'
}
