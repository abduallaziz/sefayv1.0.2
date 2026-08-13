import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '../api/quality.api';

const staleTime = 60 * 1000;

export function useInspections() {
  return useQuery({ queryKey: ['quality', 'inspections'], queryFn: qualityApi.getInspections, staleTime });
}
export function useHolds() {
  return useQuery({ queryKey: ['quality', 'holds'], queryFn: qualityApi.getHolds, staleTime });
}
export function useNonConformances() {
  return useQuery({ queryKey: ['quality', 'ncr'], queryFn: qualityApi.getNonConformances, staleTime });
}
export function useCorrectiveActions() {
  return useQuery({ queryKey: ['quality', 'capa'], queryFn: qualityApi.getCorrectiveActions, staleTime });
}
export function useInspectionSummary() {
  return useQuery({ queryKey: ['quality', 'analytics', 'inspections'], queryFn: qualityApi.getInspectionSummary, staleTime });
}
export function useNcrTrends() {
  return useQuery({ queryKey: ['quality', 'analytics', 'ncr-trends'], queryFn: qualityApi.getNcrTrends, staleTime });
}
export function useCapaPerformance() {
  return useQuery({ queryKey: ['quality', 'analytics', 'capa-performance'], queryFn: qualityApi.getCapaPerformance, staleTime });
}
export function useSupplierRanking() {
  return useQuery({ queryKey: ['quality', 'analytics', 'supplier-ranking'], queryFn: qualityApi.getSupplierRanking, staleTime });
}

function invalidateQuality(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['quality'] });
}

export function useCompleteInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: string; notes?: string; auto_hold?: boolean } }) =>
      qualityApi.completeInspection(id, body),
    onSuccess: () => invalidateQuality(qc),
  });
}

export function useReleaseHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { approved: boolean; reason?: string; disposition?: string } }) =>
      qualityApi.releaseHold(id, body),
    onSuccess: () => invalidateQuality(qc),
  });
}

export function useCreateNonConformance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => qualityApi.createNonConformance(body),
    onSuccess: () => invalidateQuality(qc),
  });
}

export function useUpdateNcrStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status: string; root_cause?: string; resolution_notes?: string } }) =>
      qualityApi.updateNcrStatus(id, body),
    onSuccess: () => invalidateQuality(qc),
  });
}

export function useCreateCorrectiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => qualityApi.createCorrectiveAction(body),
    onSuccess: () => invalidateQuality(qc),
  });
}

export function useCapaLifecycle() {
  const qc = useQueryClient();
  const start = useMutation({ mutationFn: (id: string) => qualityApi.startCorrectiveAction(id), onSuccess: () => invalidateQuality(qc) });
  const complete = useMutation({ mutationFn: ({ id, body }: { id: string; body: { notes?: string; disposition?: string } }) => qualityApi.completeCorrectiveAction(id, body), onSuccess: () => invalidateQuality(qc) });
  const verify = useMutation({ mutationFn: ({ id, body }: { id: string; body: { effectiveness_check: string } }) => qualityApi.verifyCorrectiveAction(id, body), onSuccess: () => invalidateQuality(qc) });
  const close = useMutation({ mutationFn: ({ id, body }: { id: string; body: { closure_notes?: string } }) => qualityApi.closeCorrectiveAction(id, body), onSuccess: () => invalidateQuality(qc) });
  return { start, complete, verify, close };
}
