'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useOpenShift } from '../hooks/useShifts';
import { NumberInput } from '@/shared/ui/number-input';
import { useEscape } from '@/lib/use-escape';
import { useRegisters } from '@/features/pos-registers/hooks';

interface Props {
  branchId: string;
  onClose: () => void;
}

export function OpenShiftModal({ branchId, onClose }: Props) {
  const t = useTranslations('shifts');
  const mutation = useOpenShift();

  const [openingCash, setOpeningCash] = useState('');
  const [picked, setPicked] = useState<string>('');
  useEscape(onClose, !mutation.isPending);

  // Registers (صناديق) of this branch. A picker is only needed when the branch has more than one; a single
  // register is resolved automatically (here and on the server), so no effect/state sync is required.
  const { data: registers } = useRegisters(branchId);
  const activeRegisters = (registers ?? []).filter((r) => r.is_active);
  const needsPicker = activeRegisters.length > 1;
  const registerId = needsPicker ? picked : activeRegisters[0]?.id ?? '';

  const invalid = openingCash !== '' && !Number.isFinite(Number(openingCash));
  const missingRegister = needsPicker && !picked;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || missingRegister || mutation.isPending) return;
    try {
      await mutation.mutateAsync({
        opening_cash: Number(openingCash) || 0,
        branch_id: branchId,
        register_id: registerId || undefined,
      });
      onClose();
    } catch {
      /* the failure toast is shown centrally; keep the dialog open */
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60">
      <div role="dialog" aria-modal="true" aria-label={t('open_shift')} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('open_shift')}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {needsPicker && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('register')}
              </label>
              <select
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C]"
              >
                <option value="">{t('choose_register')}</option>
                {activeRegisters.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('opening_cash')}
            </label>
            <NumberInput
              value={openingCash}
              onChange={setOpeningCash}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || missingRegister}
              className="flex-1 px-4 py-2 rounded-lg bg-[#0C447C] hover:bg-[#0a3a6b] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? t('opening') : t('open')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}