'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProfile, useSubscription, useUsage, useUpdateProfile } from '../hooks/useSettings';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { Building2, CreditCard, BarChart3, Save, Coins, Users, Percent, Receipt, Printer, Bell } from 'lucide-react';
import { CustomFieldsManager } from '@/features/customers/components/CustomFieldsManager';
import { NumberInput } from '@/shared/ui/number-input';
import type { NotificationPreferences } from '../api/settings.api';

const NOTIFICATION_KEYS: (keyof NotificationPreferences)[] = [
  'subscription_expired',
  'payment_failed',
  'payment_success',
];

const CURRENCIES = [
  { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', label: 'يورو' },
  { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', label: 'دينار كويتي' },
  { code: 'BHD', symbol: 'د.ب', label: 'دينار بحريني' },
  { code: 'QAR', symbol: 'ر.ق', label: 'ريال قطري' },
  { code: 'OMR', symbol: 'ر.ع', label: 'ريال عماني' },
];

export function SettingsPage() {
  const t = useTranslations('settings');
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscriptionData, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const { currency_code, setCurrency } = useTenantStore();
  const [name, setName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency_code);
  const [taxRatePercent, setTaxRatePercent] = useState('');
  const [taxRateError, setTaxRateError] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [autoPrint, setAutoPrint] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Every updateProfile() call below shares this — without it, a failed save (e.g. a
  // 429 from the rate limiter, or any network error) previously failed completely
  // silently: the toggle/field just stayed as it was, with no indication anything
  // went wrong, which read as "the toggle doesn't save."
  function onSaveError(e: any) {
    setSaveError(e?.message ?? t('saveError'));
  }

  const sub = (subscriptionData as any)?.subscription;

  useEffect(() => {
    if (profile?.tax_rate !== undefined) {
      setTaxRatePercent(String(Math.round(profile.tax_rate * 100 * 100) / 100));
    }
  }, [profile?.tax_rate]);

  useEffect(() => {
    if (profile) {
      setLogoUrl(profile.logo_url ?? '');
      setTaxNumber(profile.tax_number ?? '');
      setInvoiceFooter(profile.invoice_footer ?? '');
      setPaperWidth(profile.printer_settings?.paper_width ?? '80mm');
      setAutoPrint(profile.printer_settings?.auto_print ?? false);
    }
  }, [profile]);

  function handleSaveName() {
    if (!name.trim()) return;
    setSaveError(null);
    updateProfile({ name: name.trim() }, { onError: onSaveError });
  }

  function handleToggleCustomerCapture(enabled: boolean) {
    setSaveError(null);
    updateProfile({ customer_capture_enabled: enabled }, { onError: onSaveError });
  }

  function handleSaveCurrency() {
    const cur = CURRENCIES.find(c => c.code === selectedCurrency);
    if (!cur) return;
    setSaveError(null);
    updateProfile(
      { currency_code: cur.code, currency_symbol: cur.symbol },
      {
        onSuccess: () => setCurrency(cur.code, cur.symbol),
        onError: onSaveError,
      }
    );
  }

  function handleSaveTaxRate() {
    const value = Number(taxRatePercent);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setTaxRateError(true);
      return;
    }
    setTaxRateError(false);
    setSaveError(null);
    updateProfile({ tax_rate: value / 100 }, { onError: onSaveError });
  }

  function handleSaveInvoiceCustomization() {
    setSaveError(null);
    updateProfile(
      {
        ...(logoUrl.trim() ? { logo_url: logoUrl.trim() } : {}),
        tax_number: taxNumber.trim(),
        invoice_footer: invoiceFooter.trim(),
      },
      { onError: onSaveError },
    );
  }

  function handleSavePrinterSettings() {
    setSaveError(null);
    updateProfile({ printer_settings: { paper_width: paperWidth, auto_print: autoPrint } }, { onError: onSaveError });
  }

  function handleToggleNotification(key: keyof NotificationPreferences, enabled: boolean) {
    setSaveError(null);
    updateProfile(
      { notification_preferences: { ...profile?.notification_preferences, [key]: enabled } },
      { onError: onSaveError },
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      {saveError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
        </div>
      )}

      {/* Profile */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('profile')}</h2>
        </div>
        {profileLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('businessName')}</label>
              <input
                type="text"
                defaultValue={profile?.name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('businessType')}</label>
              <input
                type="text"
                value={profile?.business_type ?? '—'}
                disabled
                className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-400"
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={isPending || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Currency */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('currency')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CURRENCIES.map((cur) => (
            <button
              key={cur.code}
              onClick={() => setSelectedCurrency(cur.code)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-all ${
                selectedCurrency === cur.code
                  ? 'border-[#0C447C] bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#B5D4F4]'
                  : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-[#0C447C]/50'
              }`}
            >
              <span className="text-lg font-bold">{cur.symbol}</span>
              <span className="text-xs">{cur.code}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleSaveCurrency}
          disabled={isPending || selectedCurrency === currency_code}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
        >
          <Save className="w-4 h-4" />
          {isPending ? t('saving') : t('save')}
        </button>
      </div>

      {/* Tax Rate */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('taxRate')}</h2>
        </div>
        {profileLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 max-w-[160px]">
              <NumberInput
                value={taxRatePercent}
                onChange={(v) => { setTaxRatePercent(v); setTaxRateError(false); }}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500">{t('taxRateHint')}</p>
            {taxRateError && <p className="text-xs text-red-500">{t('taxRateError')}</p>}
            <button
              onClick={handleSaveTaxRate}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Invoice Customization */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('invoiceCustomization')}</h2>
        </div>
        {profileLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('logoUrl')}</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('taxNumber')}</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('invoiceFooter')}</label>
              <textarea
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
              />
            </div>
            <button
              onClick={handleSaveInvoiceCustomization}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Printer Settings */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Printer className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('printerSettings')}</h2>
        </div>
        {profileLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('paperWidth')}</label>
              <div className="flex gap-2">
                {(['58mm', '80mm'] as const).map((width) => (
                  <button
                    key={width}
                    onClick={() => setPaperWidth(width)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      paperWidth === width
                        ? 'border-[#0C447C] bg-[#E8F1FB] dark:bg-[#0C447C]/20 text-[#0C447C] dark:text-[#B5D4F4]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-[#0C447C]/50'
                    }`}
                  >
                    {width}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{t('autoPrint')}</span>
              <button
                onClick={() => setAutoPrint(!autoPrint)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoPrint ? 'bg-[#0C447C]' : 'bg-slate-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    autoPrint ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleSavePrinterSettings}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('notificationPreferences')}</h2>
        </div>
        <p className="text-xs text-slate-500">{t('notificationPreferencesHint')}</p>
        {profileLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-2">
            {NOTIFICATION_KEYS.map((key) => {
              const enabled = profile?.notification_preferences?.[key] !== false;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t(`notifications.${key}`)}</span>
                  <button
                    onClick={() => handleToggleNotification(key, !enabled)}
                    disabled={isPending}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                      enabled ? 'bg-[#0C447C]' : 'bg-slate-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        enabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Customer Fields */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('customFields')}</h2>
          </div>
          {profileLoading ? (
            <div className="h-6 w-12 bg-slate-100 dark:bg-gray-800 rounded-full animate-pulse" />
          ) : (
            <button
              onClick={() => handleToggleCustomerCapture(!profile?.customer_capture_enabled)}
              disabled={isPending}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                profile?.customer_capture_enabled ? 'bg-[#0C447C]' : 'bg-slate-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  profile?.customer_capture_enabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'
                }`}
              />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {t('customFieldsHint')}
        </p>
        <CustomFieldsManager />
      </div>

      {/* Subscription */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('subscription')}</h2>
        </div>
        {subLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">{t('plan')}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-white mt-1">{sub?.plan_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('status')}</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">{sub?.status ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('interval')}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-white mt-1">{sub?.billing_cycle ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('endsAt')}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-white mt-1">
                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('en-US') : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('usage')}</h2>
        </div>
        {usageLoading ? (
          <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('users')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-[#0C447C] h-2 rounded-full"
                    style={{ width: `${Math.min(((usage?.users?.used ?? 0) / (usage?.users?.limit ?? 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{usage?.users?.used ?? 0}/{usage?.users?.limit ?? sub?.max_users ?? 0}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('branches')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full"
                    style={{ width: `${Math.min(((usage?.branches?.used ?? 0) / (usage?.branches?.limit ?? 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{usage?.branches?.used ?? 0}/{usage?.branches?.limit ?? sub?.max_branches ?? 0}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('invoicesThisMonth')}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{usage?.invoices_this_month?.used ?? 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}