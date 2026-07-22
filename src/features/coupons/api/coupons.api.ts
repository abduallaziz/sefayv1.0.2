import { apiClient } from '@/lib/api'

export type CouponDiscountType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  discount_type: CouponDiscountType
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
  created_at: string
}

export interface CouponInput {
  code: string
  discount_type: CouponDiscountType
  discount_value: number
  max_discount_amount?: number
  min_order_amount?: number
  max_uses?: number
  valid_from?: string
  valid_to?: string
}

export interface CouponValidation {
  code: string
  discount_type: CouponDiscountType
  discount_value: number
  discount_amount: number
}

export const couponsApi = {
  getAll: (): Promise<Coupon[]> => apiClient.get('/coupons'),

  create: (data: CouponInput): Promise<Coupon> => apiClient.post('/coupons', data),

  update: (id: string, data: Partial<CouponInput & { is_active: boolean }>): Promise<Coupon> =>
    apiClient.patch(`/coupons/${id}`, data),

  remove: (id: string): Promise<void> => apiClient.delete(`/coupons/${id}`),

  // Preview-only — does not redeem/increment used_count. Throws if the code is
  // invalid/expired/inactive/below min_order_amount, same errors as checkout itself.
  validate: (code: string, subtotal: number): Promise<CouponValidation> =>
    apiClient.post('/coupons/validate', { code, subtotal }),
}
