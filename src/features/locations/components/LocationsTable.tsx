'use client';

import { useTranslations } from 'next-intl';
import { Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Location } from '../types/location.types';

interface Props {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onToggleActive: (location: Location) => void;
  onCreate?: () => void;
}

export function LocationsTable({
  locations, total, page, limit, onPageChange, onEdit, onDelete, onToggleActive, onCreate,
}: Props) {
  const t = useTranslations('locations');
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-gray-900 border border-dashed border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="p-4 rounded-full bg-[#E8F1FB] dark:bg-[#0C447C]/10 mb-4">
          <MapPin size={32} className="text-[#0C447C] dark:text-[#5B9BD5]" />
        </div>
        <p className="text-base font-semibold text-slate-700 dark:text-gray-200">{t('noLocations')}</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{t('noLocationsHint')}</p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addLocation')}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {locations.map((location) => (
          <div key={location.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{location.name}</p>
                <p className="text-xs text-slate-500 truncate">{location.code}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(location)} aria-label={t('editLocation')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(location)} aria-label={t('deleteLocation')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-gray-800">
              <span className="text-xs text-slate-500 truncate">{location.description ?? '—'}</span>
              <button
                onClick={() => onToggleActive(location)}
                className={`flex items-center gap-1 text-xs font-medium ${
                  location.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              >
                {location.is_active
                  ? <><ToggleRight className="w-4 h-4" />{t('active')}</>
                  : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-10">
            <tr>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('code')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('name')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500">{t('description')}</th>
              <th className="text-start px-3 py-3 font-medium text-slate-500 w-20">{t('status')}</th>
              <th className="px-3 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {locations.map((location, i) => (
              <tr key={location.id} className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/40 dark:bg-gray-800/10' : ''}`}>
                <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{location.code}</td>
                <td className="px-3 py-3 text-slate-800 dark:text-white max-w-[160px] truncate">{location.name}</td>
                <td className="px-3 py-3 text-slate-500 max-w-[240px] truncate">{location.description ?? '—'}</td>
                <td className="px-3 py-3 w-20">
                  <button
                    onClick={() => onToggleActive(location)}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      location.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {location.is_active
                      ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></>
                      : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>
                    }
                  </button>
                </td>
                <td className="px-3 py-3 w-16">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(location)}
                      aria-label={t('editLocation')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(location)}
                      aria-label={t('deleteLocation')}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {t('pageOf', { page, totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
