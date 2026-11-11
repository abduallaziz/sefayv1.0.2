// Mirrors api/src/modules/print/print.types.ts (the server owns the shape).

export type PaperWidth = '58mm' | '80mm' | 'A4'
export type TemplateKind = 'invoice' | 'kitchen'

export interface TemplateBlock {
  key: string
  visible: boolean
}

export interface InvoiceTemplate {
  logo_path: string | null
  logo_url: string | null
  show_logo: boolean
  business_name: string | null
  address: string | null
  phone: string | null
  tax_number: string | null
  commercial_register: string | null
  footer: string | null
  paper_width: PaperWidth
  blocks: TemplateBlock[]
  qr_enabled: boolean
  copies: number
}

export interface KitchenTemplate {
  header_text: string | null
  paper_width: PaperWidth
  font_size: 'sm' | 'md' | 'lg'
  blocks: TemplateBlock[]
  show_item_notes: boolean
  copies: number
}

export interface InvoicePrintPayload {
  kind: 'invoice'
  order_id: string
  order_number: string
  created_at: string
  currency_symbol: string
  /** tenants.printer_settings.auto_print */
  auto_print: boolean
  template: InvoiceTemplate
  business: {
    name: string
    address: string | null
    phone: string | null
    tax_number: string | null
    commercial_register: string | null
    logo_url: string | null
    footer: string | null
  }
  status: string
  items: { name: string; variant_name: string | null; quantity: number; unit_price: number; total: number }[]
  totals: {
    subtotal: number
    discount: number
    tax: number
    total: number
    tax_rate: number
    tax_inclusive: boolean
  }
  payments: { method: string; amount: number }[]
  cash_tendered: number | null
  change: number | null
  cashier_name: string | null
  customer: { name: string | null; phone: string | null } | null
  vehicle_plate: string | null
  worker_name: string | null
  note: string | null
  qr_base64: string | null
}

export interface KitchenPrintPayload {
  kind: 'kitchen'
  order_id: string
  order_number: string
  created_at: string
  currency_symbol: string
  auto_print: boolean
  template: KitchenTemplate
  header_text: string | null
  business_name: string
  table_name: string | null
  vehicle_plate: string | null
  cashier_name: string | null
  items: { name: string; variant_name: string | null; quantity: number; kitchen_status: string | null }[]
  note: string | null
  only_unsent: boolean
}

export type PrintPayload = InvoicePrintPayload | KitchenPrintPayload

/** All visible words on a printed ticket. Comes from messages/{en,ar}/print.json. */
export interface PrintLabels {
  receipt: Record<
    | 'invoice' | 'number' | 'date' | 'customer' | 'phone' | 'vehicle' | 'cashier' | 'worker'
    | 'notes' | 'qty' | 'subtotal' | 'discount' | 'vat' | 'total' | 'payments' | 'cashTendered'
    | 'change' | 'taxNumber' | 'commercialRegister' | 'taxInclusive' | 'taxExclusive' | 'cancelled'
    | 'logoAlt' | 'qrAlt',
    string
  >
  payment: Record<string, string>
  kitchen: Record<'title' | 'orderNumber' | 'table' | 'car' | 'time' | 'cashier' | 'notes' | 'newItemsOnly', string>
}

export interface RenderOptions {
  /** 'rtl' for Arabic. */
  dir: 'rtl' | 'ltr'
  lang: string
}
