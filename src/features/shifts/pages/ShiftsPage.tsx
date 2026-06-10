'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentShift } from '../hooks/useShifts';
import { CurrentShiftBanner } from '../components/CurrentShiftBanner';
import { ShiftsList } from '../components/ShiftsList';
import { OpenShiftModal } from '../components/OpenShiftModal';
import { CloseShiftModal } from '../components/CloseShiftModal';
import { ShiftSummaryModal } from '../components/ShiftSummaryModal';
import { useAuthStore } from '@/core/auth/stores/auth.store';

export function ShiftsPage() {
  const t = useTranslations('shifts');
  const { user } = useAuthStore();
  const { data: currentShift } = useCurrentShift();

  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [summaryShiftId, setSummaryShiftId] = useState<string | null>(null);

  const branchId = user?.branchId ?? '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      <CurrentShiftBanner
        onOpenShift={() => setShowOpen(true)}
        onCloseShift={() => setShowClose(true)}
        onViewSummary={(id) => setSummaryShiftId(id)}
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('history')}</h2>
        </div>
        <ShiftsList onViewSummary={(id) => setSummaryShiftId(id)} />
      </div>

      {showOpen && (
        <OpenShiftModal branchId={branchId} onClose={() => setShowOpen(false)} />
      )}

      {showClose && currentShift && (
        <CloseShiftModal shift={currentShift} onClose={() => setShowClose(false)} />
      )}

      {summaryShiftId && (
        <ShiftSummaryModal shiftId={summaryShiftId} onClose={() => setSummaryShiftId(null)} />
      )}
    </div>
  );
}