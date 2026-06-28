'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { StockCountItem } from '../types/stock-count.types';

interface Props {
  items: StockCountItem[];
  editable: boolean;
  onSubmitCount: (itemId: string, countedQuantity: number) => void;
  isSubmitting?: boolean;
}

export function StockCountItemsTable({ items, editable, onSubmitCount, isSubmitting }: Props) {
  const t = useTranslations('stockCounts');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const varianceClass = (variance: number) =>
    variance === 0
      ? 'text-slate-400'
      : variance > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
          <tr>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('item')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('expectedQuantity')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('countedQuantity')}</th>
            <th className="text-start px-3 py-3 font-medium text-slate-500">{t('variance')}</th>
            {editable && <th className="text-start px-3 py-3 font-medium text-slate-500" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {items.map((item) => {
            const hasCount = item.counted_quantity !== null;
            const variance = hasCount ? (item.counted_quantity as number) - item.expected_quantity : 0;
            const draft = drafts[item.id] ?? '';
            return (
              <tr key={item.id}>
                <td className="px-3 py-3 text-slate-800 dark:text-white">{item.item_name ?? item.item_id}</td>
                <td className="px-3 py-3 text-slate-500">{item.expected_quantity}</td>
                <td className="px-3 py-3 text-slate-500">{hasCount ? item.counted_quantity : '—'}</td>
                <td className={`px-3 py-3 font-medium ${varianceClass(variance)}`}>
                  {hasCount ? (variance > 0 ? `+${variance}` : variance) : '—'}
                </td>
                {editable && (
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={t('enterCount')}
                        value={draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                        className="w-24 px-2 py-1 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting || draft === ''}
                        onClick={() => onSubmitCount(item.id, Number(draft))}
                        className="p-1.5 rounded-lg bg-[#0C447C] hover:bg-[#0a3a6b] text-white disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
