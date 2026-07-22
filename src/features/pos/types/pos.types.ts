export interface POSItem {
  id: string
  name: string
  name_ar: string
  price: number
  category: string
  type: 'product' | 'service' | 'custom'
  has_variants: boolean
  variants?: POSVariant[]
  image_url?: string
}

export interface POSVariant {
  id: string
  name: string
  price_adjustment: number
}

export interface CartItem {
  id: string
  item_id: string
  name: string
  variant_id?: string
  variant_name?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  coupon_code?: string
  coupon_discount_amount: number
  tax_amount: number
  tax_rate: number
  total: number
}

// Matches CreateInvoiceDto.payment_method on the backend exactly (see
// api/src/modules/invoices/dto/create-invoice.dto.ts) — all 9 values are
// real, accepted, and persisted by invoices.service.ts today. Only 'cash'
// and 'split' need an amount-tendered/change flow; every other method is
// treated as "paid in full via that method", same as 'card' already was.
// 'gift_card' is never manually selected by the cashier — InvoicesService
// derives it server-side (overriding whatever method was picked) when a
// gift card covers the entire total, since no cash/card/etc. actually
// changed hands. The frontend mirrors that same override locally so the
// receipt shown immediately after confirming matches what the server
// actually stored (see PaymentModal.handleConfirm).
export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'split'
  | 'wallet'
  | 'mada'
  | 'visa'
  | 'mastercard'
  | 'stc_pay'
  | 'gift_card'
  | 'apple_pay'
  | 'tab'

export interface PaymentData {
  method: PaymentMethod
  cash_tendered?: number
  change?: number
  split_cash?: number
  split_card?: number
  redeem_points?: number
  gift_card_code?: string
  gift_card_amount?: number
}