import { apiClient } from '@/lib/api';
import type { Shift, ShiftSummaryResponse, OpenShiftDto, CloseShiftDto } from '../types';

export const shiftsApi = {
  getCurrent: (): Promise<Shift | null> =>
    apiClient.get<Shift | null>('/shifts/current'),

  getAll: (): Promise<Shift[]> =>
    apiClient.get<Shift[]>('/shifts'),

  getSummary: (id: string): Promise<ShiftSummaryResponse> =>
    apiClient.get<ShiftSummaryResponse>(`/shifts/${id}/summary`),

  open: (dto: OpenShiftDto): Promise<Shift> =>
    apiClient.post<Shift>('/shifts/open', dto),

  close: (id: string, dto: CloseShiftDto): Promise<Shift> =>
    apiClient.post<Shift>(`/shifts/${id}/close`, dto),
};