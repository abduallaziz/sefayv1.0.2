import { apiClient } from '@/lib/api'

export type WashStatus = 'waiting' | 'washing' | 'ready' | 'delivered' | 'cancelled'

export interface WashJob {
  id: string
  branch_id: string
  order_id: string | null
  customer_id: string | null
  plate: string
  vehicle_size: string | null
  status: WashStatus
  assigned_worker_id: string | null
  queue_date: string
  queue_number: number
  notes: string | null
  created_at: string
  washing_at: string | null
  ready_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  ready_notified_at: string | null
}

export interface WashBoard {
  branch_id: string
  date: string
  columns: Record<WashStatus, WashJob[]>
}

export interface CreateWashJobDto {
  branch_id: string
  plate: string
  vehicle_size?: string
  order_id?: string
  assigned_worker_id?: string
  notes?: string
}

export const queueApi = {
  getBoard: (branchId: string, date?: string): Promise<WashBoard> => {
    const q = new URLSearchParams({ branch_id: branchId })
    if (date) q.set('date', date)
    return apiClient.get<WashBoard>(`/wash-queue/board?${q.toString()}`)
  },
  create: (dto: CreateWashJobDto): Promise<WashJob> =>
    apiClient.post<WashJob>('/wash-queue', dto),
  changeStatus: (id: string, status: Exclude<WashStatus, 'waiting'>): Promise<WashJob> =>
    apiClient.patch<WashJob>(`/wash-queue/${id}/status`, { status }),
  assign: (id: string, workerId: string | null): Promise<WashJob> =>
    apiClient.patch<WashJob>(`/wash-queue/${id}/worker`, { worker_id: workerId }),
}
