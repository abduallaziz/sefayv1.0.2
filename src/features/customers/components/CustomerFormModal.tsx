'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Customer, CreateCustomerDto } from '../types/customer.types';
import { useCustomerFieldDefinitions } from '../hooks/useCustomers';

interface Props {
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto) => void;
  isLoading?: boolean;
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

export function CustomerFormModal({ customer, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('customers');
  const isEdit = !!customer;
  const { data: fieldDefs, isLoading: fieldsLoading } = useCustomerFieldDefinitions();
  const [values, setValues] = useState<Record<string, string>>({});

  const activeFields = (fieldDefs ?? [])
    .filter((f) => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (customer?.custom_fields) {
      const initial: Record<string, string> = {};
      for (const [key, value] of Object.entries(customer.custom_fields)) {
        if (value !== null && value !== undefined) initial[key] = String(value);
      }
      setValues(initial);
    } else {
      setValues({});
    }
  }, [customer]);

  const missingRequired = activeFields.some((f) => f.required && !values[f.field_key]?.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired) return;

    const custom_fields: Record<string, string | number | boolean> = {};
    for (const field of activeFields) {
      const raw = values[field.field_key];
      if (raw === undefined || raw === '') continue;
      if (field.field_type === 'number') custom_fields[field.field_key] = Number(raw);
      else if (field.field_type === 'boolean') custom_fields[field.field_key] = raw === 'true';
      else custom_fields[field.field_key] = raw;
    }

    onSubmit({ custom_fields });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {isEdit ? t('form.title_edit') : t('form.title_add')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {fieldsLoading ? (
            <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : activeFields.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              لا توجد حقول مفعّلة — أضف حقول العميل من الإعدادات أولًا
            </p>
          ) : (
            activeFields.map((field) => (
              <div key={field.field_key}>
                <label className={labelClass}>
                  {field.label_ar} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.field_type === 'select' ? (
                  <select
                    value={values[field.field_key] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {(field.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label_ar}</option>
                    ))}
                  </select>
                ) : field.field_type === 'boolean' ? (
                  <select
                    value={values[field.field_key] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                  </select>
                ) : (
                  <input
                    type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                    value={values[field.field_key] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [field.field_key]: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </div>
            ))
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              {t('form.cancel')}
            </button>
            <button type="submit" disabled={isLoading || missingRequired} className="flex-1 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {isLoading ? t('form.saving') : isEdit ? t('form.save') : t('form.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
