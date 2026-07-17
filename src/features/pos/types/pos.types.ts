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
export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'split'
  | 'wallet'
  | 'mada'
  | 'visa'
  | 'mastercard'
  | 'stc_pay'
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