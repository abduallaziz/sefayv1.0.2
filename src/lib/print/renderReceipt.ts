import qrcode from 'qrcode-generator'
import type {
  InvoicePrintPayload,
  KitchenPrintPayload,
  PaperWidth,
  PrintLabels,
  PrintPayload,
  RenderOptions,
} from './types'

// ONE renderer for everything: the POS receipt, the Orders reprint, the kitchen
// ticket and the live preview in the designers. It returns a complete HTML
// document string (print CSS included) so a hidden iframe can print it and an
// <iframe srcDoc> can preview it with identical output.
// Numbers and dates are always formatted with the en-US locale (English digits,
// even in Arabic) and wrapped in <bdi dir="ltr"> so RTL never reorders them.

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const money = (n: number) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ltr = (s: string) => `<bdi dir="ltr">${esc(s)}</bdi>`
const dateTime = (iso: string) => ltr(new Date(iso).toLocaleString('en-US'))

function only(url: string | null): string | null {
  // Only http(s)/data image URLs may reach an <img src>.
  return url && /^(https?:\/\/|data:image\/)/i.test(url) ? url : null
}

export function qrSvgDataUrl(base64Tlv: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(base64Tlv)
  qr.make()
  return qr.createDataURL(4, 0)
}

const PAGE: Record<PaperWidth, { size: string; width: string; pad: string; font: string }> = {
  '58mm': { size: '58mm auto', width: '58mm', pad: '2mm', font: '11px' },
  '80mm': { size: '80mm auto', width: '80mm', pad: '3mm', font: '12px' },
  A4: { size: 'A4', width: '190mm', pad: '0', font: '14px' },
}

const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{font-family:'Segoe UI',Tahoma,Arial,'Noto Naskh Arabic','Noto Sans Arabic',sans-serif;line-height:1.35;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.rc{width:100%;padding:var(--pad)}
.rc+.rc{page-break-before:always;break-before:page}
.c{text-align:center}
.logo{display:block;margin:0 auto 1.5mm;max-width:60%;max-height:20mm;object-fit:contain}
.name{font-weight:700;font-size:1.25em}
.muted{font-size:.92em}
hr{border:0;border-top:1px dashed #000;margin:2mm 0}
.row{display:flex;justify-content:space-between;gap:2mm;align-items:baseline}
.row>span:first-child{flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
.row>span:last-child{flex:0 0 auto;white-space:nowrap}
.item{margin:1mm 0}
.item .sub{font-size:.9em}
.tot{font-weight:700;font-size:1.2em;border-top:1px solid #000;margin-top:1mm;padding-top:1mm}
.badge{display:inline-block;border:1px solid #000;padding:0 2mm;font-weight:700;margin:1mm 0}
.qr{display:block;margin:2mm auto 0;width:32mm;height:32mm;image-rendering:pixelated}
.k-num{font-weight:700;font-size:1.8em}
.k-item{display:flex;gap:2mm;margin:1.2mm 0;font-weight:700}
.k-item .q{min-width:8mm}
.note{white-space:pre-wrap;overflow-wrap:anywhere}
`

function documentHtml(body: string, paper: PaperWidth, opts: RenderOptions, extraCss = ''): string {
  const p = PAGE[paper] ?? PAGE['80mm']
  return `<!doctype html><html lang="${esc(opts.lang)}" dir="${opts.dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>@page{size:${p.size};margin:${paper === 'A4' ? '10mm' : '0'}}
:root{--pad:${p.pad}}
html,body{width:${p.width};font-size:${p.font}}
${paper === 'A4' ? 'body{margin:0 auto}' : ''}
${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`
}

function line(label: string, value: string): string {
  return `<div class="row"><span>${esc(label)}</span><span>${value}</span></div>`
}

function renderInvoiceOne(p: InvoicePrintPayload, L: PrintLabels): string {
  const b = p.business
  const logo = only(b.logo_url)
  const cur = esc(p.currency_symbol)
  const out: string[] = []

  out.push('<div class="rc"><div class="c">')
  if (logo) out.push(`<img class="logo" src="${esc(logo)}" alt="${esc(L.receipt.logoAlt)}">`)
  out.push(`<div class="name">${esc(b.name)}</div>`)
  if (b.address) out.push(`<div class="muted">${esc(b.address)}</div>`)
  if (b.phone) out.push(`<div class="muted">${ltr(b.phone)}</div>`)
  // Tax number and commercial register are OPTIONAL: printed only when filled.
  if (b.tax_number) out.push(`<div class="muted">${esc(L.receipt.taxNumber)}: ${ltr(b.tax_number)}</div>`)
  if (b.commercial_register)
    out.push(`<div class="muted">${esc(L.receipt.commercialRegister)}: ${ltr(b.commercial_register)}</div>`)
  out.push('</div><hr>')

  out.push(line(L.receipt.invoice, ltr(`#${p.order_number}`)))
  out.push(line(L.receipt.date, dateTime(p.created_at)))
  if (p.status === 'cancelled') out.push(`<div class="c"><span class="badge">${esc(L.receipt.cancelled)}</span></div>`)

  const visible = (key: string) => p.template.blocks.find((x) => x.key === key)?.visible !== false
  const orderOf = (keys: string[]) =>
    p.template.blocks.map((x) => x.key).filter((k) => keys.includes(k))

  // Info zone: before the items, in the order chosen in the designer.
  const info: Record<string, string> = {}
  if (p.customer?.name || p.customer?.phone) {
    const v = [p.customer.name ? esc(p.customer.name) : '', p.customer.phone ? ltr(p.customer.phone) : '']
      .filter(Boolean)
      .join(' ')
    info.customer = line(L.receipt.customer, v)
  }
  if (p.vehicle_plate) info.vehicle = line(L.receipt.vehicle, ltr(p.vehicle_plate))
  if (p.cashier_name) info.cashier = line(L.receipt.cashier, esc(p.cashier_name))
  if (p.worker_name) info.worker = line(L.receipt.worker, esc(p.worker_name))
  const infoHtml = orderOf(['customer', 'vehicle', 'cashier', 'worker'])
    .filter((k) => visible(k) && info[k])
    .map((k) => info[k])
  if (infoHtml.length) out.push('<hr>' + infoHtml.join(''))

  out.push('<hr>')
  for (const it of p.items) {
    const name = it.variant_name ? `${it.name} (${it.variant_name})` : it.name
    out.push(
      `<div class="item"><div>${esc(name)}</div><div class="row sub"><span>${ltr(
        `${it.quantity} × ${money(it.unit_price)}`,
      )}</span><span>${ltr(money(it.total))}</span></div></div>`,
    )
  }
  out.push('<hr>')

  const t = p.totals
  out.push(line(L.receipt.subtotal, ltr(money(t.subtotal))))
  if (t.discount > 0) out.push(line(L.receipt.discount, ltr(`-${money(t.discount)}`)))
  const pct = (t.tax_rate * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })
  out.push(line(L.receipt.vat.replace('{percent}', `${pct}%`), ltr(money(t.tax))))
  out.push(
    `<div class="row tot"><span>${esc(L.receipt.total)}</span><span>${ltr(money(t.total))} ${cur}</span></div>`,
  )
  out.push(`<div class="muted c">${esc(t.tax_inclusive ? L.receipt.taxInclusive : L.receipt.taxExclusive)}</div>`)

  // Foot zone: payments then notes (order from the designer).
  const foot: Record<string, string> = {}
  if (p.payments.length) {
    let h = `<div><b>${esc(L.receipt.payments)}</b></div>`
    for (const pay of p.payments) {
      h += line(L.payment[pay.method] ?? pay.method, `${ltr(money(pay.amount))} ${cur}`)
    }
    if (p.cash_tendered !== null) h += line(L.receipt.cashTendered, `${ltr(money(p.cash_tendered))} ${cur}`)
    if (p.change !== null && p.change > 0) h += line(L.receipt.change, `${ltr(money(p.change))} ${cur}`)
    foot.payments = h
  }
  if (p.note) foot.notes = `<div><b>${esc(L.receipt.notes)}</b></div><div class="note">${esc(p.note)}</div>`
  const footHtml = orderOf(['payments', 'notes'])
    .filter((k) => visible(k) && foot[k])
    .map((k) => foot[k])
  if (footHtml.length) out.push('<hr>' + footHtml.join('<div style="height:1.5mm"></div>'))

  if (b.footer) out.push(`<hr><div class="c note">${esc(b.footer)}</div>`)
  if (p.qr_base64) out.push(`<img class="qr" src="${qrSvgDataUrl(p.qr_base64)}" alt="${esc(L.receipt.qrAlt)}">`)
  out.push('</div>')
  return out.join('')
}

export function renderInvoiceHtml(p: InvoicePrintPayload, L: PrintLabels, o: RenderOptions): string {
  const one = renderInvoiceOne(p, L)
  const copies = Math.min(Math.max(p.template.copies || 1, 1), 5)
  return documentHtml(one.repeat(copies), p.template.paper_width, o)
}

function renderKitchenOne(p: KitchenPrintPayload, L: PrintLabels): string {
  const visible = (key: string) => p.template.blocks.find((x) => x.key === key)?.visible !== false
  const out: string[] = ['<div class="rc">']
  const title = p.header_text || p.business_name
  out.push(`<div class="c"><div class="name">${esc(title)}</div><div>${esc(L.kitchen.title)}</div></div><hr>`)

  const meta: Record<string, string> = {
    order_number: `<div class="row"><span>${esc(L.kitchen.orderNumber)}</span><span class="k-num">${ltr(`#${p.order_number}`)}</span></div>`,
  }
  if (p.table_name) meta.table = line(L.kitchen.table, esc(p.table_name))
  if (p.vehicle_plate) meta.vehicle = line(L.kitchen.car, ltr(p.vehicle_plate))
  meta.time = line(L.kitchen.time, dateTime(p.created_at))
  if (p.cashier_name) meta.cashier = line(L.kitchen.cashier, esc(p.cashier_name))
  const metaKeys = p.template.blocks.map((b) => b.key).filter((k) => k !== 'notes')
  out.push(metaKeys.filter((k) => visible(k) && meta[k]).map((k) => meta[k]).join(''))
  out.push('<hr>')

  // NO prices on a kitchen ticket.
  for (const it of p.items) {
    const name = it.variant_name ? `${it.name} (${it.variant_name})` : it.name
    out.push(`<div class="k-item"><span class="q">${ltr(`${it.quantity} ×`)}</span><span>${esc(name)}</span></div>`)
  }
  if (p.only_unsent) out.push(`<div class="muted c">${esc(L.kitchen.newItemsOnly)}</div>`)
  if (p.note && visible('notes') && p.template.show_item_notes) {
    out.push(`<hr><div><b>${esc(L.kitchen.notes)}</b></div><div class="note">${esc(p.note)}</div>`)
  }
  out.push('</div>')
  return out.join('')
}

const KITCHEN_FONT = { sm: '1em', md: '1.25em', lg: '1.6em' } as const

export function renderKitchenHtml(p: KitchenPrintPayload, L: PrintLabels, o: RenderOptions): string {
  const one = renderKitchenOne(p, L)
  const copies = Math.min(Math.max(p.template.copies || 1, 1), 5)
  return documentHtml(
    one.repeat(copies),
    p.template.paper_width,
    o,
    `.k-item{font-size:${KITCHEN_FONT[p.template.font_size] ?? KITCHEN_FONT.md}}`,
  )
}

export function renderPrintHtml(p: PrintPayload, L: PrintLabels, o: RenderOptions): string {
  return p.kind === 'invoice' ? renderInvoiceHtml(p, L, o) : renderKitchenHtml(p, L, o)
}
