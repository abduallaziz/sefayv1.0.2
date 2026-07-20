import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useLocale } from 'next-intl';

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

// English UI shows the ISO currency code (e.g. "SAR", "USD") instead of the
// native symbol — native symbols like "ر.س" read oddly (and are unreadable
// for non-Arabic-script currencies' native symbols) inside an English page.
// Arabic keeps the native symbol as before. Applies to every currency, not
// just SAR, since the ISO code is always a safe universal fallback.
export function useCurrencyDisplay(): string {
  const locale = useLocale();
  const currencyCode = useTenantStore((s) => s.currency_code);
  const currencySymbol = useTenantStore((s) => s.currency_symbol);
  return locale === 'en' ? currencyCode : currencySymbol;
}
