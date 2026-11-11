import { create } from 'zustand';
import type { CloseReport } from '../types';

// Which register close report is open on screen. Kept in a store (not in
// the page that closed the register) because the POS screen swaps to its
// "register closed" view the instant the register closes.
interface ShiftReportState {
  shiftId: string | null;
  report: CloseReport | null;
  show: (shiftId: string, report?: CloseReport) => void;
  hide: () => void;
}

export const useShiftReportStore = create<ShiftReportState>((set) => ({
  shiftId: null,
  report: null,
  show: (shiftId, report) => set({ shiftId, report: report ?? null }),
  hide: () => set({ shiftId: null, report: null }),
}));
