import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SAUDI_RIYAL_DISPLAY = '⃁';

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
