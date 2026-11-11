import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftsApi } from '../api/shifts.api';
import { ApiError } from '@/lib/api';
import type { OpenShiftDto, CloseShiftDto } from '../types';

const KEYS = {
  current: ['shifts', 'current'] as const,
  all: ['shifts'] as const,
  summary: (id: string) => ['shifts', id, 'summary'] as const,
  report: (id: string) => ['shifts', id, 'report'] as const,
};

export const useCurrentShift = () =>
  useQuery({
    queryKey: KEYS.current,
    queryFn: shiftsApi.getCurrent,
    // A rate-limit (429) or a server hiccup is transient: retry a few times with
    // backoff instead of failing the first load (which made the POS look like the
    // register was closed). Other 4xx errors are real answers and are not retried.
    retry: (failureCount, error) =>
      failureCount < 3 && error instanceof ApiError && (error.status === 429 || error.status >= 500),
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 8000),
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
    // Defect N2: a summary opened while the register was open stayed stale
    // after closing. Always refetch when the modal opens.
    staleTime: 0,
    refetchOnMount: 'always',
  });

export const useShiftReport = (id: string) =>
  useQuery({
    queryKey: KEYS.report(id),
    queryFn: () => shiftsApi.getReport(id),
    enabled: !!id,
    // A closed register's report never changes.
    staleTime: Infinity,
  });

export const useOpenShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpenShiftDto) => shiftsApi.open(dto),
    onSuccess: (data) => {
      qc.setQueryData(KEYS.current, data);
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    // كانت تفشل بصمت — الكاشير يرى الزر "لا يستجيب" بلا أي رسالة (مثلًا محاولة فتح
    // صندوق ثانٍ بينما لديه واحد مفتوح أصلًا). كل فشل الآن يظهر كتنبيه واضح.
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to open cash register session');
    },
  });
};

export const useOpenDrawer = () =>
  useMutation({
    mutationFn: () => shiftsApi.openDrawer(),
  });

export const useCloseShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CloseShiftDto }) =>
      shiftsApi.close(id, dto),
    onSuccess: (data) => {
      // N2: drop any cached summary of this shift so it is refetched with the
      // real closing figures.
      qc.removeQueries({ queryKey: ['shifts', data.shift.id, 'summary'] });
      qc.setQueryData(KEYS.report(data.shift.id), data.report);
      qc.setQueryData(KEYS.current, null);
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.current });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to close cash register session');
    },
  });
};