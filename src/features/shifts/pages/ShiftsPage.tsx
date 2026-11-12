'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentShift } from '../hooks/useShifts';
import { CurrentShiftBanner } from '../components/CurrentShiftBanner';
import { ShiftsList } from '../components/ShiftsList';
import { OpenShiftModal } from '../components/OpenShiftModal';
import { CloseShiftModal } from '../components/CloseShiftModal';
import { ShiftSummaryModal } from '../components/ShiftSummaryModal';
import { useAuthStore } from '@/core/auth/stores/auth.store';
import { useBranchContext } from '@/core/branch/useBranchContext';

export function ShiftsPage() {
  const t = useTranslations('shifts');
  const { user } = useAuthStore();
  const { data: currentShift } = useCurrentShift();
  const qc = useQueryClient();

  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [summaryShiftId, setSummaryShiftId] = useState<string | null>(null);


  // The branch the user actually selected (shared branch context), not just
  // the newest branch in the list.
  const { currentBranchId } = useBranchContext()
  const branchId = currentBranchId ?? '';

  const handleCloseShift = () => {
    setShowClose(false);
    qc.invalidateQueries({ queryKey: ['shifts'] });
    qc.invalidateQueries({ queryKey: ['shifts', 'current'] });
  };

  const handleOpenShift = () => {
    setShowOpen(false);
    qc.invalidateQueries({ queryKey: ['shifts'] });
    qc.invalidateQueries({ queryKey: ['shifts', 'current'] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
      </div>

      <CurrentShiftBanner
        onOpenShift={() => setShowOpen(true)}
        onCloseShift={() => setShowClose(true)}
        onViewSummary={(id) => setSummaryShiftId(id)}
      />

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('history')}</h2>
        </div>
        <ShiftsList onViewSummary={(id) => setSummaryShiftId(id)} />
      </div>

      {showOpen && <OpenShiftModal branchId={branchId} onClose={handleOpenShift} />}
      {showClose && currentShift && <CloseShiftModal shift={currentShift} onClose={handleCloseShift} />}
      {summaryShiftId && <ShiftSummaryModal shiftId={summaryShiftId} onClose={() => setSummaryShiftId(null)} />}
    </div>
  );
}