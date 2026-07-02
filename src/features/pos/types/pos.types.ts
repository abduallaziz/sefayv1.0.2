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
  discount_amount: number
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number
  coupon_code?: string
  tax_amount: number
  tax_rate: number
  total: number
}

export type PaymentMethod = 'cash' | 'card' | 'split'

export interface PaymentData {
  method: PaymentMethod
  cash_tendered?: number
  change?: number
  split_cash?: number
  split_card?: number
}