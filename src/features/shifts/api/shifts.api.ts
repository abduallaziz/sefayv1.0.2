import { apiClient, ApiError, refreshSession } from '@/lib/api';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import type { Shift, ShiftSummaryResponse, OpenShiftDto, CloseShiftDto, CloseShiftResponse, CloseReport } from '../types';

export const shiftsApi = {
  getCurrent: async (): Promise<Shift | null> => {
  try {
    const data = await apiClient.get<Shift | null>('/shifts/current');
    return data ?? null;
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

  close: (id: string, dto: CloseShiftDto): Promise<CloseShiftResponse> =>
    apiClient.post<CloseShiftResponse>(`/shifts/${id}/close`, dto),

  getReport: (id: string): Promise<CloseReport> =>
    apiClient.get<CloseReport>(`/shifts/${id}/report`),

  // The report as a real PDF (built by the server). apiClient is JSON-only,
  // so this mirrors its auth handling for a binary response.
  getReportPdf: async (id: string, lang: 'ar' | 'en'): Promise<Blob> => {
    const call = () =>
      fetch(`/api/v1/shifts/${id}/report.pdf?lang=${lang}`, {
        credentials: 'include',
        headers: useAuthStore.getState().accessToken
          ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
          : {},
      });
    let res = await call();
    if (res.status === 401) {
      const refreshed = await refreshSession();
      if (!refreshed) throw new ApiError(401, 'Unauthorized');
      useAuthStore.getState().setAccessToken(refreshed.access_token, refreshed.realtime_token);
      res = await call();
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, err.message ?? 'Request failed');
    }
    return res.blob();
  },

  openDrawer: (): Promise<{ logged: boolean; shift_id: string }> =>
    apiClient.post<{ logged: boolean; shift_id: string }>('/shifts/drawer-open', {}),
};