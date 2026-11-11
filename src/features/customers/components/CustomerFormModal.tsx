'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Customer, CreateCustomerDto } from '../types/customer.types';
import { useCustomerFieldDefinitions } from '../hooks/useCustomers';
import { useProfile } from '@/features/settings/hooks/useSettings';
import { SingleDatePicker } from '@/shared/ui/date-range-picker';
import { NumberInput } from '@/shared/ui/number-input';
import { VehiclesEditor } from './VehiclesEditor';

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
  const tCommon = useTranslations('common');
  const isEdit = !!customer;
  const { data: fieldDefs, isLoading: fieldsLoading } = useCustomerFieldDefinitions();
  const { data: profile } = useProfile();
  const nameFieldEnabled = profile?.name_field_enabled ?? false;
  // CustomerFormModal is only ever mounted while the modal is open (the
  // parent conditionally renders it), so the `customer` prop is fixed for
  // this instance's whole lifetime — initial values can be computed once via
  // lazy initializers instead of synced through an effect on every mount.
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!customer?.custom_fields) return {};
    const initial: Record<string, string> = {};
    for (const [key, value] of Object.entries(customer.custom_fields)) {
      if (value !== null && value !== undefined) initial[key] = String(value);
    }
    return initial;
  });
  const [fullName, setFullName] = useState(customer?.full_name ?? '');

  const activeFields = (fieldDefs ?? [])
    .filter((f) => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  // The phone is a field the tenant chooses to enable (Settings > customer
  // fields); it is not drawn unless enabled. Customers created before the
  // field existed (or from the POS) keep their phone only in the `phone`
  // column, so a field bound to the phone starts from that value instead of
  // showing empty. An unchanged prefilled value is not re-sent.
  const fieldValue = (field: (typeof activeFields)[number]) =>
    values[field.field_key] ?? (field.contact_role === 'phone' ? customer?.phone ?? '' : '');
  // Cars follow the same rule as the phone: the section exists only when the
  // tenant enabled a field bound to the plate number. When editing, that
  // section replaces the single plate field (a customer can have many cars).
  const showCars = isEdit && !!customer && activeFields.some((f) => f.contact_role === 'plate_number');
  const shownFields = isEdit ? activeFields.filter((f) => f.contact_role !== 'plate_number') : activeFields;
  // With nothing to fill in, adding would create an empty, unrecognisable
  // customer (no name, phone or car) and editing would change nothing, so
  // the button stays off until the tenant enables a field (or the name).
  const nothingToFill = !fieldsLoading && !nameFieldEnabled && !showCars && shownFields.length === 0;

  const missingRequired =
    (nameFieldEnabled && !fullName.trim()) ||
    shownFields.some((f) => f.required && !fieldValue(f).trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired || nothingToFill) return;

    const custom_fields: Record<string, string | number | boolean> = {};
    for (const field of activeFields) {
      const raw = values[field.field_key];
      if (raw === undefined || raw === '') continue;
      if (field.field_type === 'number') custom_fields[field.field_key] = Number(raw);
      else if (field.field_type === 'boolean') custom_fields[field.field_key] = raw === 'true';
      else custom_fields[field.field_key] = raw;
    }

    onSubmit({ ...(nameFieldEnabled ? { full_name: fullName.trim() } : {}), custom_fields });
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
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
          {nameFieldEnabled && (
            <div>
              <label className={labelClass}>
                {t('form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
          )}
          {showCars && customer && <VehiclesEditor customerId={customer.id} />}
          {fieldsLoading ? (
            <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : shownFields.length === 0 ? (
            // The hint only makes sense when there is nothing at all to fill.
            nothingToFill ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {t('form.noFields')}
              </p>
            ) : null
          ) : (
            shownFields.map((field) => (
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
                    <option value="true">{tCommon('yes')}</option>
                    <option value="false">{tCommon('no')}</option>
                  </select>
                ) : field.field_type === 'date' ? (
                  <SingleDatePicker
                    value={values[field.field_key] || undefined}
                    onChange={(v) => setValues((p) => ({ ...p, [field.field_key]: v ?? '' }))}
                  />
                ) : field.field_type === 'number' ? (
                  <NumberInput
                    value={values[field.field_key] ?? ''}
                    onChange={(v) => setValues((p) => ({ ...p, [field.field_key]: v }))}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValue(field)}
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
            <button type="submit" disabled={isLoading || missingRequired || nothingToFill} className="flex-1 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {isLoading ? t('form.saving') : isEdit ? t('form.save') : t('form.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
