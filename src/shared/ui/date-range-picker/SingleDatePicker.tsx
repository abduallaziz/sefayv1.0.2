'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

export function SingleDatePicker({ value, onChange, placeholder }: Props) {
  const t = useTranslations('datePicker');

  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={placeholder ?? t('placeholderSingle')}
      className="w-full border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white hover:border-[#0C447C] dark:hover:border-blue-500 focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500 transition-colors"
    />
  );
}
