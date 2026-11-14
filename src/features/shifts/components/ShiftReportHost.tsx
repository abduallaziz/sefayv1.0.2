'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useShiftReportStore } from '../stores/shift-report.store';
import { ShiftReportModal } from './ShiftReportModal';

// Mounted once in the dashboard layout.
export function ShiftReportHost() {
  const { shiftId, report, hide } = useShiftReportStore();
  const pathname = usePathname();
  // The report must not follow the user to another page.
  useEffect(() => {
    hide();
  }, [pathname, hide]);
  if (!shiftId) return null;
  return <ShiftReportModal shiftId={shiftId} initialReport={report ?? undefined} onClose={hide} />;
}
