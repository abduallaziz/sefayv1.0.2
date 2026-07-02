'use client';

import { useTranslations } from 'next-intl';
import { FileEdit, Send, Check, PackageCheck, X } from 'lucide-react';
import { PurchaseOrderStatus } from '../types/purchase-order.types';

interface Step {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  done: boolean;
  active: boolean;
  rejected?: boolean;
}

interface Props {
  status: PurchaseOrderStatus;
}

export function PurchaseOrderWorkflowTimeline({ status }: Props) {
  const t = useTranslations('purchasing');

  const isCancelled = status === 'cancelled';
  const order: PurchaseOrderStatus[] = ['draft', 'submitted', 'approved', 'partially_received', 'received'];
  const currentIdx = order.indexOf(status);

  const steps: Step[] = [
    { key: 'draft', labelKey: 'status.draft', icon: FileEdit, done: currentIdx > 0, active: status === 'draft' },
    { key: 'submitted', labelKey: 'status.submitted', icon: Send, done: currentIdx > 1, active: status === 'submitted' },
    { key: 'approved', labelKey: 'status.approved', icon: Check, done: currentIdx > 2, active: status === 'approved' },
    {
      key: 'received',
      labelKey: status === 'partially_received' ? 'status.partially_received' : 'status.received',
      icon: PackageCheck,
      done: status === 'received',
      active: status === 'partially_received' || status === 'received',
    },
  ];

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500 text-white">
          <X className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('status.cancelled')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : step.active
                    ? 'bg-[#0C447C] text-white'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-400'
              }`}
            >
              <step.icon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                step.done || step.active ? 'text-slate-700 dark:text-gray-200' : 'text-slate-400'
              }`}
            >
              {t(step.labelKey)}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                steps[idx + 1].done || steps[idx + 1].active ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
