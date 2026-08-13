'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { RequiredMark } from '@/shared/components/ui/RequiredMark';
import type { Location, CreateLocationDTO } from '../types/location.types';

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean(),
  parent_location_id: z.string().optional(),
  location_type: z.string().optional(),
  location_purpose: z.string().optional(),
  max_quantity: z.string().optional(),
  max_weight: z.string().optional(),
  max_volume: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationDTO) => void;
  location?: Location | null;
  locations: Location[];
  isLoading?: boolean;
  submitError?: string | null;
}

const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]";
const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export function LocationFormModal({ open, onClose, onSubmit, location, locations, isLoading, submitError }: Props) {
  const t = useTranslations('locations');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', description: '', is_active: true, parent_location_id: '', location_type: '', location_purpose: '', max_quantity: '', max_weight: '', max_volume: '' },
  });

  useEffect(() => {
    if (location) {
      reset({
        code: location.code,
        name: location.name,
        description: location.description ?? '',
        is_active: location.is_active,
        parent_location_id: location.parent_location_id ?? '',
        location_type: location.location_type ?? '',
        location_purpose: location.location_purpose ?? '',
        max_quantity: location.max_quantity != null ? String(location.max_quantity) : '',
        max_weight: location.max_weight != null ? String(location.max_weight) : '',
        max_volume: location.max_volume != null ? String(location.max_volume) : '',
      });
    } else {
      reset({ code: '', name: '', description: '', is_active: true, parent_location_id: '', location_type: '', location_purpose: '', max_quantity: '', max_weight: '', max_volume: '' });
    }
  }, [location, reset]);

  if (!open) return null;

  const handleFormSubmit = (data: z.infer<typeof schema>) => {
    const dto: CreateLocationDTO = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      is_active: data.is_active,
      parent_location_id: data.parent_location_id || undefined,
      location_type: (data.location_type || undefined) as CreateLocationDTO['location_type'],
      location_purpose: data.location_purpose || undefined,
      max_quantity: data.max_quantity ? Number(data.max_quantity) : undefined,
      max_weight: data.max_weight ? Number(data.max_weight) : undefined,
      max_volume: data.max_volume ? Number(data.max_volume) : undefined,
    };
    onSubmit(dto);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-start justify-center bg-black/60 p-4 pt-16 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {location ? t('editLocation') : t('addLocation')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('code')}<RequiredMark /></label>
              <input {...register('code')} className={inputClass} />
              {errors.code && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
            <div>
              <label className={labelClass}>{t('name')}<RequiredMark /></label>
              <input {...register('name')} className={inputClass} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{t('required')}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('description')}</label>
            <textarea {...register('description')} rows={2} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('parentLocation')}</label>
              <select {...register('parent_location_id')} className={inputClass}>
                <option value="">{t('noParent')}</option>
                {locations.filter((l) => l.id !== location?.id).map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('locationType')}</label>
              <select {...register('location_type')} className={inputClass}>
                <option value="">—</option>
                <option value="zone">{t('types.zone')}</option>
                <option value="aisle">{t('types.aisle')}</option>
                <option value="rack">{t('types.rack')}</option>
                <option value="shelf">{t('types.shelf')}</option>
                <option value="bin">{t('types.bin')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('locationPurpose')}</label>
            <select {...register('location_purpose')} className={inputClass}>
              <option value="">—</option>
              <option value="receiving">{t('purposes.receiving')}</option>
              <option value="storage">{t('purposes.storage')}</option>
              <option value="picking">{t('purposes.picking')}</option>
              <option value="packing">{t('purposes.packing')}</option>
              <option value="quality_hold">{t('purposes.quality_hold')}</option>
              <option value="damaged">{t('purposes.damaged')}</option>
              <option value="shipping">{t('purposes.shipping')}</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('maxQuantity')}</label>
              <input type="number" {...register('max_quantity')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('maxWeight')}</label>
              <input type="number" {...register('max_weight')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('maxVolume')}</label>
              <input type="number" {...register('max_volume')} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
            <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">{t('active')}</label>
          </div>

          {submitError && (
            <p className="text-xs text-red-500 -mt-1">{submitError}</p>
          )}

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
