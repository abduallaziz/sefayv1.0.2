'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useBranches } from '../hooks/useWarehouses';
import type { Warehouse, CreateWarehouseDTO } from '../types/warehouse.types';

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  branch_id: z.string().uuid().optional().or(z.literal('')),
  address: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWarehouseDTO) => void;
  warehouse?: Warehouse | null;
  isLoading?: boolean;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function WarehouseFormModal({ open, onClose, onSubmit, warehouse, isLoading }: Props) {
  const t = useTranslations('warehouses');
  const { data: branches = [] } = useBranches();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', branch_id: '', address: '' },
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        code: warehouse.code,
        name: warehouse.name,
        branch_id: warehouse.branch_id ?? '',
        address: warehouse.address ?? '',
      });
    } else {
      reset({ code: '', name: '', branch_id: '', address: '' });
    }
  }, [warehouse, reset]);

  // Single-branch tenants: skip the selection step entirely, bind the UUID directly.
  useEffect(() => {
    if (!warehouse && branches.length === 1) {
      setValue('branch_id', branches[0].id);
    }
  }, [warehouse, branches, setValue]);

  if (!open) return null;

  const handleFormSubmit = (data: z.infer<typeof schema>) => {
    const dto: CreateWarehouseDTO = {
      code: data.code,
      name: data.name,
      branch_id: data.branch_id || undefined,
      address: data.address || undefined,
    };
    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {warehouse ? t('editWarehouse') : t('addWarehouse')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('code')}</label>
              <input {...register('code')} className={inputClass} />
              {errors.code && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('name')}</label>
              <input {...register('name')} className={inputClass} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('branchId')}</label>
            <select {...register('branch_id')} className={inputClass}>
              <option value="">{t('noBranch')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id.message}</p>}
          </div>

          <div>
            <label className={labelClass}>{t('address')}</label>
            <input {...register('address')} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isLoading ? t('saving') : t('save')}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
