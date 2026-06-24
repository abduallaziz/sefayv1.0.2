import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// U+E900 (Private Use Area) — the saudi_riyal font's stable, non-combining
// mapping. U+20C1 is the "new" Unicode codepoint but is categorized as a
// combining mark, which some mobile text-shaping engines (HarfBuzz/CoreText)
// refuse to render standalone, causing it to disappear or show as a box.
const SAUDI_RIYAL_DISPLAY = '';

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
