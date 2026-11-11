'use client';

import { useShiftReportStore } from '../stores/shift-report.store';
import { ShiftReportModal } from './ShiftReportModal';

// Mounted once in the dashboard layout.
export function ShiftReportHost() {
  const { shiftId, report, hide } = useShiftReportStore();
  if (!shiftId) return null;
  return <ShiftReportModal shiftId={shiftId} initialReport={report ?? undefined} onClose={hide} />;
}
