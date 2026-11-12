export interface POSItem {
  id: string
  name: string
  name_ar: string
  price: number
  category: string
  type: 'product' | 'service' | 'custom' | 'raw_material' | 'semi_finished' | 'finished_goods' | 'asset' | 'consumable'
  has_variants: boolean
  variants?: POSVariant[]
  image_url?: string
  category_name?: string
  // Shown as a badge only; selling is not blocked here.
  out_of_stock?: boolean
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
  // G4 - the worker who performed this line; the server snapshots the
  // commission from the user's rate at sale time.
  worker_id?: string
  // Shown on the cart line (photo + category chip).
  image_url?: string
  category_name?: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  // Raw sum of item prices, pre-discount, pre-tax-extraction — equals
  // `subtotal` under exclusive mode, but differs under inclusive mode
  // (where `subtotal` is net/derived). This is the exact basis the
  // backend uses when independently re-validating a coupon's discount
  // amount at checkout (InvoicesService.create(), manualBuilt.subtotal) —
  // coupon-preview calls must use this, not `subtotal`, so the preview
  // discount can never disagree with what checkout actually applies.
  rawSubtotal: number
  coupon_code?: string
  coupon_discount_amount: number
  tax_amount: number
  tax_rate: number
  tax_inclusive: boolean
  total: number
}

// Matches CreateInvoiceDto.payment_method on the backend exactly (see
// api/src/modules/invoices/dto/create-invoice.dto.ts) — all values are
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
  // Explicit, cashier/customer-confirmed reward instance selection — matches
  // CreateInvoiceDto.redeem_reward_instance_ids exactly. Coexists with
  // redeem_points on the same invoice per invoices.service.ts.
  redeem_reward_instance_ids?: string[]
  // Free-item rewards set to "one of several": the product picked for each.
  free_item_choices?: Array<{ reward_instance_id: string; item_id: string }>
  // Variant (size/colour) of each free item that has variants.
  free_item_variants?: Array<{ reward_instance_id: string; item_id: string; variant_id: string }>
}