import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  currency_code: string;
  currency_symbol: string;
  setCurrency: (code: string, symbol: string) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currency_code: 'SAR',
      currency_symbol: '⃁',
      setCurrency: (currency_code, currency_symbol) =>
        set({ currency_code, currency_symbol }),
    }),
    {
      name: 'sefay-tenant',
    }
  )
);