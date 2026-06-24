import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Temporary fallback: the new Saudi Riyal Unicode sign (U+20C1, finalized
// Sept 2025) is not reliably supported by mobile OS fonts yet, even with
// a bundled web font (PUA U+E900) as a fallback. Until mobile font
// coverage catches up, use the plain Arabic abbreviation, which renders
// correctly everywhere with zero custom-font dependency. Revert to the
// symbol by changing this one constant once mobile support is solid.
const SAUDI_RIYAL_DISPLAY = 'ر.س';

interface TenantState {
  currency_code: string;
  currency_symbol: string;
  setCurrency: (code: string, symbol: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currency_code: 'SAR',
      currency_symbol: SAUDI_RIYAL_DISPLAY,
      setCurrency: (currency_code, currency_symbol) =>
        set({
          currency_code,
          currency_symbol: currency_code === 'SAR' ? SAUDI_RIYAL_DISPLAY : currency_symbol,
        }),
    }),
    {
      name: 'sefay-tenant',
      onRehydrateStorage: () => (state) => {
        if (state && state.currency_code === 'SAR') {
          state.currency_symbol = SAUDI_RIYAL_DISPLAY;
        }
      },
    }
  )
);
