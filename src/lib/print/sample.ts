import type { InvoicePrintPayload, InvoiceTemplate, KitchenPrintPayload, KitchenTemplate } from './types'

// Sample tickets for the designers' LIVE PREVIEW. They go through the very same
// renderer as a real print; only the data is made up. All words come from the
// `print.sample` messages (never hardcoded here).

export interface SampleStrings {
  businessName: string
  address: string
  phone: string
  item1: string
  item2: string
  customer: string
  plate: string
  cashier: string
  worker: string
  note: string
  footer: string
  table: string
}

export interface TemplateFallbacks {
  business_name: string | null
  address: string | null
  phone: string | null
  tax_number: string | null
  logo_url: string | null
  footer: string | null
}

/** Minimal ZATCA TLV (same layout as the API) so the preview can draw a real QR. */
function tlv(tag: number, value: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(value))
  return [tag, bytes.length, ...bytes]
}
function sampleQrBase64(name: string, vat: string, total: number, vatAmount: number): string {
  const all = [
    ...tlv(1, name),
    ...tlv(2, vat),
    ...tlv(3, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')),
    ...tlv(4, total.toFixed(2)),
    ...tlv(5, vatAmount.toFixed(2)),
  ]
  return btoa(String.fromCharCode(...all))
}

export function sampleInvoicePayload(
  template: InvoiceTemplate,
  fb: TemplateFallbacks,
  s: SampleStrings,
  logoUrl: string | null,
  currencySymbol: string,
): InvoicePrintPayload {
  const items = [
    { name: s.item1, variant_name: null, quantity: 1, unit_price: 25, total: 25 },
    { name: s.item2, variant_name: null, quantity: 2, unit_price: 10, total: 20 },
  ]
  const subtotal = 45
  const tax = 6.75
  const total = 51.75
  const name = template.business_name ?? fb.business_name ?? s.businessName
  const tax_number = template.tax_number ?? fb.tax_number
  return {
    kind: 'invoice',
    order_id: 'sample',
    order_number: 'A1B2C3',
    // shows the number format chosen in the designer
    invoice_no: `${template.invoice_number?.prefix ?? 'INV-'}${'1'.padStart(template.invoice_number?.padding ?? 6, '0')}`,
    created_at: new Date().toISOString(),
    currency_symbol: currencySymbol,
    auto_print: false,
    template,
    business: {
      name,
      address: template.address ?? fb.address ?? s.address,
      phone: template.phone ?? fb.phone ?? s.phone,
      tax_number,
      commercial_register: template.commercial_register,
      logo_url: template.show_logo ? (logoUrl ?? template.logo_url ?? fb.logo_url) : null,
      footer: template.footer ?? fb.footer ?? s.footer,
    },
    status: 'completed',
    items,
    totals: { subtotal, discount: 0, tax, total, tax_rate: 0.15, tax_inclusive: false },
    payments: [
      { method: 'cash', amount: 30 },
      { method: 'card', amount: 21.75 },
    ],
    cash_tendered: null,
    change: null,
    cashier_name: s.cashier,
    customer: { name: s.customer, phone: s.phone },
    vehicle_plate: s.plate,
    worker_name: s.worker,
    note: s.note,
    qr_base64: template.qr_enabled && tax_number ? sampleQrBase64(name, tax_number, total, tax) : null,
  }
}

export function sampleKitchenPayload(
  template: KitchenTemplate,
  s: SampleStrings,
  currencySymbol: string,
): KitchenPrintPayload {
  return {
    kind: 'kitchen',
    order_id: 'sample',
    order_number: 'A1B2C3',
    created_at: new Date().toISOString(),
    currency_symbol: currencySymbol,
    auto_print: false,
    template,
    header_text: template.header_text,
    business_name: s.businessName,
    table_name: s.table,
    vehicle_plate: s.plate,
    cashier_name: s.cashier,
    items: [
      { name: s.item1, variant_name: null, quantity: 1, kitchen_status: 'pending' },
      { name: s.item2, variant_name: null, quantity: 2, kitchen_status: 'pending' },
    ],
    note: s.note,
    only_unsent: true,
  }
}
