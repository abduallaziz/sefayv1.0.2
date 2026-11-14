'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Printer, Share2, X } from 'lucide-react';
import { shiftsApi } from '../api/shifts.api';
import { useShiftReport } from '../hooks/useShifts';
import { printPdf, sharePdf } from '../utils/reportOutput';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store';
import { useEscape } from '@/lib/use-escape';
import type { CloseReport } from '../types';

interface Props {
  shiftId: string;
  // Present right after closing (the report is already in hand).
  initialReport?: CloseReport;
  onClose: () => void;
}

const diffClass = (n: number | null) =>
  n === null || n === 0
    ? 'text-emerald-600'
    : n > 0
      ? 'text-amber-600'
      : 'text-red-600';

const signed = (n: number | null) =>
  n === null ? '—' : n === 0 ? '0.00' : `${n > 0 ? '+' : '-'}${formatNumber(Math.abs(n))}`;
// the sign must stay on the left of the number inside an RTL page

export function ShiftReportModal({ shiftId, initialReport, onClose }: Props) {
  const t = useTranslations('shifts');
  const locale = useLocale();
  const lang: 'ar' | 'en' = locale === 'ar' ? 'ar' : 'en';
  const currency = useCurrencyDisplay();
  const { data: fetched, isLoading, isError } = useShiftReport(initialReport ? '' : shiftId);
  const report = initialReport ?? fetched;
  useEscape(onClose);
  const [busy, setBusy] = useState<'print' | 'share' | null>(null);

  const getPdf = async () => shiftsApi.getReportPdf(shiftId, lang);
  const fileName = `register-report-${shiftId.slice(0, 8)}.pdf`;

  const handlePrint = async () => {
    setBusy('print');
    try {
      printPdf(await getPdf());
    } catch (e) {
      toast.error(t('report_failed'), { id: 'shift-report-failed' });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      const result = await sharePdf(await getPdf(), fileName, t('report_title'));
      if (result === 'downloaded') toast.success(t('report_downloaded'));
    } catch (e) {
      toast.error(t('report_failed'), { id: 'shift-report-failed' });
    } finally {
      setBusy(null);
    }
  };

  const methodName = (m: string) => t(`method_${m}`);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-label={t('report_title')} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('report_title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {!report && (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            {isError ? t('report_failed') : isLoading ? t('loading') : ''}
          </div>
        )}

        {report && (
          <div className="px-5 py-4 space-y-4 text-sm">
            {report.legacy && (
              <p className="text-xs rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-3 py-2">
                {t('report_legacy_note')}
              </p>
            )}

            <dl className="space-y-1.5">
              <Row label={t('branch')} value={report.shift.branch_name ?? '—'} />
              <Row label={t('cashier')} value={report.shift.cashier_name ?? '—'} />
              <Row label={t('opened_at')} value={formatDateTime(report.shift.opened_at, locale)} ltr />
              <Row label={t('closed_at')} value={formatDateTime(report.shift.closed_at, locale)} ltr />
            </dl>

            <hr className="border-dashed border-slate-200 dark:border-gray-800" />

            <dl className="space-y-1.5">
              <Row label={t('invoices_count')} value={String(report.totals.invoice_count)} />
              <Row label={t('items_count')} value={String(report.totals.items_count)} />
              <Row label={t('total_sales')} value={formatCurrency(report.totals.total_sales, currency)} ltr />
              <Row label={t('discounts')} value={formatCurrency(report.totals.discount_total, currency)} ltr />
              <Row label={t('tax')} value={formatCurrency(report.totals.tax_total, currency)} ltr />
              <Row label={t('total_expenses')} value={formatCurrency(report.totals.expenses_total, currency)} ltr />
              <Row
                label={t('cancelled_invoices')}
                value={`${report.totals.cancelled_count} · ${formatCurrency(report.totals.cancelled_amount, currency)}`}
                ltr
              />
              <Row
                label={t('returned')}
                value={`${report.totals.returned_count ?? 0} · ${formatCurrency(report.totals.returned_amount ?? 0, currency)}`}
                ltr
              />
              <Row label={t('opening_cash')} value={formatCurrency(report.cash.opening, currency)} ltr />
            </dl>

            <hr className="border-dashed border-slate-200 dark:border-gray-800" />

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-start font-medium py-1">{t('payment_method')}</th>
                    <th className="text-end font-medium py-1">{t('sales')}</th>
                    <th className="text-end font-medium py-1">{t('returns_col')}</th>
                    <th className="text-end font-medium py-1">{t('expected')}</th>
                    <th className="text-end font-medium py-1">{t('counted')}</th>
                    <th className="text-end font-medium py-1">{t('difference')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.methods.map((m) => (
                    <tr key={m.method} className="border-t border-slate-100 dark:border-gray-800">
                      <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">{methodName(m.method)}</td>
                      <td className="py-1.5 text-end tabular-nums">{formatNumber(m.sales)}</td>
                      <td className="py-1.5 text-end tabular-nums">{formatNumber(m.returns ?? 0)}</td>
                      <td className="py-1.5 text-end tabular-nums">{formatNumber(m.expected)}</td>
                      <td className="py-1.5 text-end tabular-nums">{m.counted === null ? '—' : formatNumber(m.counted)}</td>
                      <td dir="ltr" className={`py-1.5 text-end tabular-nums font-semibold ${diffClass(m.difference)}`}>
                        {m.counted === null ? '—' : signed(m.difference)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.shift.notes && (
              <p className="text-xs text-slate-500">
                <b>{t('notes')}:</b> {report.shift.notes}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!report || busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <Printer size={15} />
            {busy === 'print' ? t('preparing') : t('print')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={!report || busy !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0C447C] hover:bg-[#0a3868] text-white text-sm font-medium disabled:opacity-50"
          >
            <Share2 size={15} />
            {busy === 'share' ? t('preparing') : t('share_pdf')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 dark:text-slate-100" dir={ltr ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  );
}
