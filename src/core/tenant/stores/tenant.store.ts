import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SAUDI_RIYAL_DISPLAY = '\uE900'

function resolveSymbol(symbol: string): string {
  return symbol === '⃁' || symbol === '\u20C1' ? SAUDI_RIYAL_DISPLAY : symbol
}

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
        set({ currency_code, currency_symbol: resolveSymbol(currency_symbol) }),
    }),
    {
      name: 'sefay-tenant',
      onRehydrateStorage: () => (state) => {
        if (state && state.currency_symbol) {
          state.currency_symbol = resolveSymbol(state.currency_symbol)
        }
      },
    }
  )
);