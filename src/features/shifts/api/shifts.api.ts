import { apiClient, ApiError } from '@/lib/api';
import type { Shift, ShiftSummaryResponse, OpenShiftDto, CloseShiftDto } from '../types';

export const shiftsApi = {
  getCurrent: async (): Promise<Shift | null> => {
    try {
      return await apiClient.get<Shift>('/shifts/current');
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 204)) {
        return null;
      }
      throw e;
    }
  },

  getAll: (): Promise<Shift[]> =>
    apiClient.get<Shift[]>('/shifts'),

  getSummary: (id: string): Promise<ShiftSummaryResponse> =>
    apiClient.get<ShiftSummaryResponse>(`/shifts/${id}/summary`),

  open: (dto: OpenShiftDto): Promise<Shift> =>
    apiClient.post<Shift>('/shifts/open', dto),

  close: (id: string, dto: CloseShiftDto): Promise<Shift> =>
    apiClient.post<Shift>(`/shifts/${id}/close`, dto),
};