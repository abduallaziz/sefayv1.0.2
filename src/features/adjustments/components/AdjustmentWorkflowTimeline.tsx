'use client';

import { useTranslations } from 'next-intl';
import { Check, X, Clock, FileCheck } from 'lucide-react';
import { AdjustmentStatus } from '../types/adjustment.types';

interface Step {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  done: boolean;
  active: boolean;
  rejected?: boolean;
}

interface Props {
  status: AdjustmentStatus;
}

export function AdjustmentWorkflowTimeline({ status }: Props) {
  const t = useTranslations('adjustments');

  const isRejected = status === 'rejected';
  const steps: Step[] = [
    {
      key: 'pending_approval',
      labelKey: 'workflow.pendingApproval',
      icon: Clock,
      done: true,
      active: status === 'pending_approval',
    },
    {
      key: 'approved',
      labelKey: isRejected ? 'workflow.rejected' : 'workflow.approved',
      icon: isRejected ? X : Check,
      done: status === 'approved' || status === 'posted' || isRejected,
      active: status === 'approved' || isRejected,
      rejected: isRejected,
    },
    {
      key: 'posted',
      labelKey: 'workflow.posted',
      icon: FileCheck,
      done: status === 'posted',
      active: status === 'posted',
    },
  ];

  if (isRejected) {
    steps.length = 2;
  }

  return (
    <div className="flex items-center">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                step.rejected
                  ? 'bg-red-500 text-white'
                  : step.done
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
