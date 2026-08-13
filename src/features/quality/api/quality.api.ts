import { apiClient } from '@/lib/api';
import {
  QualityInspection, QualityHold, NonConformance, CorrectiveAction,
  SupplierQualityScore, InspectionSummary, NcrTrends, CapaPerformance,
} from '../types/quality.types';

export const qualityApi = {
  // Inspections
  getInspections: () => apiClient.get<QualityInspection[]>('/quality/inspections'),
  completeInspection: (id: string, body: { status: string; notes?: string; auto_hold?: boolean }) =>
    apiClient.patch(`/quality/inspections/${id}/complete`, body),

  // Holds
  getHolds: () => apiClient.get<QualityHold[]>('/quality/holds'),
  createHold: (body: Record<string, unknown>) => apiClient.post<QualityHold>('/quality/holds', body),
  releaseHold: (id: string, body: { approved: boolean; reason?: string; disposition?: string }) =>
    apiClient.post(`/quality/holds/${id}/release`, body),

  // Non-conformances
  getNonConformances: () => apiClient.get<NonConformance[]>('/quality/non-conformances'),
  createNonConformance: (body: Record<string, unknown>) => apiClient.post<NonConformance>('/quality/non-conformances', body),
  updateNcrStatus: (id: string, body: { status: string; root_cause?: string; resolution_notes?: string }) =>
    apiClient.patch(`/quality/non-conformances/${id}/status`, body),

  // Corrective actions
  getCorrectiveActions: () => apiClient.get<CorrectiveAction[]>('/quality/corrective-actions'),
  createCorrectiveAction: (body: Record<string, unknown>) => apiClient.post<CorrectiveAction>('/quality/corrective-actions', body),
  startCorrectiveAction: (id: string) => apiClient.post(`/quality/corrective-actions/${id}/start`, {}),
  completeCorrectiveAction: (id: string, body: { notes?: string; disposition?: string }) =>
    apiClient.post(`/quality/corrective-actions/${id}/complete`, body),
  verifyCorrectiveAction: (id: string, body: { effectiveness_check: string }) =>
    apiClient.post(`/quality/corrective-actions/${id}/verify`, body),
  closeCorrectiveAction: (id: string, body: { closure_notes?: string }) =>
    apiClient.post(`/quality/corrective-actions/${id}/close`, body),

  // Analytics
  getInspectionSummary: () => apiClient.get<InspectionSummary>('/quality/analytics/inspections'),
  getNcrTrends: () => apiClient.get<NcrTrends>('/quality/analytics/ncr-trends'),
  getCapaPerformance: () => apiClient.get<CapaPerformance>('/quality/analytics/capa-performance'),
  getSupplierRanking: () => apiClient.get<SupplierQualityScore[]>('/quality/analytics/supplier-ranking'),
};
