import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesApi, AddDineInItemInput, CheckoutDineInInput } from '../api/tables.api'

// Table status can change from another cashier/device at any moment (opening a
// table, checking one out, seating a reservation/waitlist entry) — the global
// 60s staleTime (see core/providers.tsx) would otherwise leave this screen
// showing a stale "available"/"occupied" status for up to a minute after
// someone else changes it. Short staleTime + polling keeps every open Tables
// screen converging on the real state without a manual refresh.
export function useTablesList(branchId?: string) {
  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => tablesApi.getAll(branchId),
    staleTime: 5000,
    refetchInterval: 8000,
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
    onSuccess: (data, tableId) => {
      // Seeds the order query immediately instead of waiting for a second
      // round-trip — the modal can show the (empty) order right away.
      qc.setQueryData(['tables', tableId, 'order'], data)
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCurrentOrder(tableId: string | null) {
  return useQuery({
    queryKey: ['tables', tableId, 'order'],
    queryFn: () => tablesApi.getCurrentOrder(tableId as string),
    enabled: !!tableId,
    staleTime: 5000,
    // Only polls while a table's order is actually open on screen — picks up
    // items added to the same table from a different device/cashier.
    refetchInterval: tableId ? 8000 : false,
  })
}

export function useAddDineInItems(tableId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: AddDineInItemInput[]) => tablesApi.addItems(tableId, items),
    onSuccess: (data) => {
      qc.setQueryData(['tables', tableId, 'order'], data)
      // New items land in the kitchen queue immediately — don't make kitchen
      // staff wait out its own 10s poll for something already on their screen's tab.
      qc.invalidateQueries({ queryKey: ['kitchen'] })
    },
  })
}

export function useCheckoutTable(tableId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CheckoutDineInInput) => tablesApi.checkout(tableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
      qc.invalidateQueries({ queryKey: ['tables', tableId, 'order'] })
      qc.invalidateQueries({ queryKey: ['kitchen'] })
    },
  })
}

export function useReservations(filters?: { tableId?: string; from?: string; to?: string; status?: string }) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => tablesApi.getReservations(filters),
    staleTime: 5000,
    refetchInterval: 15000,
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
    staleTime: 5000,
    refetchInterval: 15000,
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
