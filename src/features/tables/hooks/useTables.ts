import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesApi, AddDineInItemInput, CheckoutDineInInput } from '../api/tables.api'

export function useTablesList(branchId?: string) {
  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => tablesApi.getAll(branchId),
  })
}

export function useCreateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { branch_id: string; name: string; capacity?: number }) => tablesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  })
}

export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tablesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  })
}

export function useOpenTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tableId: string) => tablesApi.open(tableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCurrentOrder(tableId: string | null) {
  return useQuery({
    queryKey: ['tables', tableId, 'order'],
    queryFn: () => tablesApi.getCurrentOrder(tableId as string),
    enabled: !!tableId,
  })
}

export function useAddDineInItems(tableId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: AddDineInItemInput[]) => tablesApi.addItems(tableId, items),
    onSuccess: (data) => {
      qc.setQueryData(['tables', tableId, 'order'], data)
    },
  })
}

export function useCheckoutTable(tableId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CheckoutDineInInput) => tablesApi.checkout(tableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useReservations(filters?: { tableId?: string; from?: string; to?: string; status?: string }) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => tablesApi.getReservations(filters),
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { table_id: string; customer_name: string; customer_phone?: string; party_size?: number; reservation_time: string; notes?: string }) =>
      tablesApi.createReservation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ status: string }> }) => tablesApi.updateReservation(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useWaitlist(branchId?: string, status?: string) {
  return useQuery({
    queryKey: ['waitlist', branchId, status],
    queryFn: () => tablesApi.getWaitlist(branchId, status),
  })
}

export function useCreateWaitlistEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { branch_id: string; customer_name: string; customer_phone?: string; party_size?: number; quoted_wait_minutes?: number }) =>
      tablesApi.createWaitlistEntry(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist'] }),
  })
}

export function useSeatWaitlistEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tableId }: { id: string; tableId: string }) => tablesApi.seatWaitlistEntry(id, tableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waitlist'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCancelWaitlistEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tablesApi.cancelWaitlistEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist'] }),
  })
}
