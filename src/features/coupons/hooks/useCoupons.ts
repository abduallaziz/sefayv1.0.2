import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponsApi, CouponInput } from '../api/coupons.api'

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsApi.getAll(),
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CouponInput) => couponsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CouponInput & { is_active: boolean }> }) =>
      couponsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}
