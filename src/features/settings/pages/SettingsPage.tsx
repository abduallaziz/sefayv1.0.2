'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useProfile, useSubscription, useUsage, useUpdateProfile } from '../hooks/useSettings';
import { useTenantStore } from '@/core/tenant/stores/tenant.store';
import { Building2, CreditCard, BarChart3, Save, Coins, Users, Percent } from 'lucide-react';
import { CustomFieldsManager } from '@/features/customers/components/CustomFieldsManager';

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

  const sub = (subscriptionData as any)?.subscription;

  useEffect(() => {
    if (profile?.tax_rate !== undefined) {
      setTaxRatePercent(String(Math.round(profile.tax_rate * 100 * 100) / 100));
    }
  }, [profile?.tax_rate]);

  function handleSaveName() {
    if (!name.trim()) return;
    updateProfile({ name: name.trim() });
  }

  function handleToggleCustomerCapture(enabled: boolean) {
    updateProfile({ customer_capture_enabled: enabled });
  }

  function handleSaveCurrency() {
    const cur = CURRENCIES.find(c => c.code === selectedCurrency);
    if (!cur) return;
    updateProfile(
      { currency_code: cur.code, currency_symbol: cur.symbol },
      {
        onSuccess: () => setCurrency(cur.code, cur.symbol),
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
    updateProfile({ tax_rate: value / 100 });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

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
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">العملة</h2>
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
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxRatePercent}
                onChange={(e) => { setTaxRatePercent(e.target.value); setTaxRateError(false); }}
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

      {/* Custom Customer Fields */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">حقول العميل المخصصة</h2>
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
          عند التفعيل، يظهر للكاشير خيار البحث عن عميل أو تسجيل عميل جديد عند البيع (POS).
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        )}
      </div>
    </div>
  );
}