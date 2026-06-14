import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../api/shifts.api';
import type { OpenShiftDto, CloseShiftDto } from '../types';

const KEYS = {
  current: ['shifts', 'current'] as const,
  all: ['shifts'] as const,
  summary: (id: string) => ['shifts', id, 'summary'] as const,
};

export const useCurrentShift = () =>
  useQuery({
    queryKey: KEYS.current,
    queryFn: shiftsApi.getCurrent,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    select: (data) => data ?? null,
  });

export const useShifts = () =>
  useQuery({
    queryKey: KEYS.all,
    queryFn: shiftsApi.getAll,
    staleTime: 0,
    refetchOnMount: true,
  });

export const useShiftSummary = (id: string) =>
  useQuery({
    queryKey: KEYS.summary(id),
    queryFn: () => shiftsApi.getSummary(id),
    enabled: !!id,
  });

export const useOpenShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpenShiftDto) => shiftsApi.open(dto),
    onSuccess: (data) => {
      qc.setQueryData(KEYS.current, data);
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
};

export const useCloseShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CloseShiftDto }) =>
      shiftsApi.close(id, dto),
    onSuccess: () => {
      qc.setQueryData(KEYS.current, null);
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.current });
    },
  });
};