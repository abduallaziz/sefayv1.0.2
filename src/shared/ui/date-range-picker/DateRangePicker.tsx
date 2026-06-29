'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useFloatingPosition } from './useFloatingPosition';

export interface DateRange {
  from: string | undefined;
  to: string | undefined;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fromYMD(s: string) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function today() { return toYMD(new Date()); }
function offsetDay(n: number) { const d = new Date(); d.setDate(d.getDate()+n); return toYMD(d); }
function offsetMonth(n: number) { const d = new Date(); d.setMonth(d.getMonth()+n); return toYMD(d); }
function startOfMonth() { const d = new Date(); d.setDate(1); return toYMD(d); }
function startOfYear() { const d = new Date(); d.setMonth(0,1); return toYMD(d); }
function getLastMonth(): DateRange {
  const d = new Date();
  return {
    from: toYMD(new Date(d.getFullYear(), d.getMonth()-1, 1)),
    to:   toYMD(new Date(d.getFullYear(), d.getMonth(), 0)),
  };
}
function formatLabel(s: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromYMD(s));
}

const PRESET_KEYS = ['today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth', 'last3months', 'thisYear'] as const;
type PresetKey = typeof PRESET_KEYS[number];

function getPresetRange(key: PresetKey): DateRange {
  switch (key) {
    case 'today': { const d = today(); return { from: d, to: d }; }
    case 'yesterday': { const d = offsetDay(-1); return { from: d, to: d }; }
    case 'last7': return { from: offsetDay(-6), to: today() };
    case 'last30': return { from: offsetDay(-29), to: today() };
    case 'thisMonth': return { from: startOfMonth(), to: today() };
    case 'lastMonth': return getLastMonth();
    case 'last3months': return { from: offsetMonth(-3), to: today() };
    case 'thisYear': return { from: startOfYear(), to: today() };
  }
}

export function DateRangePicker({ value, onChange, placeholder }: Props) {
  const t = useTranslations('datePicker');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from ?? '');
  const [customTo, setCustomTo] = useState(value.to ?? '');

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useFloatingPosition(triggerRef, panelRef, open);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const display = value.from || value.to
    ? [value.from && formatLabel(value.from, locale), value.to && formatLabel(value.to, locale)].filter(Boolean).join(' — ')
    : null;

  const handlePreset = (key: PresetKey) => {
    onChange(getPresetRange(key));
    setOpen(false);
  };
  const applyCustom = () => {
    onChange({ from: customFrom || undefined, to: customTo || undefined });
    setOpen(false);
  };
  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  };

  return (
    <div ref={triggerRef} className="relative inline-block" dir="rtl">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) { setCustomFrom(value.from ?? ''); setCustomTo(value.to ?? ''); }
            return next;
          });
        }}
        className="flex items-center gap-2 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white hover:border-[#0C447C] dark:hover:border-blue-500 focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500 transition-colors"
      >
        <Calendar size={14} className="text-slate-400 shrink-0" />
        <span className="truncate max-w-[170px]">
          {display ?? <span className="text-slate-400">{placeholder ?? t('placeholder')}</span>}
        </span>
        {display && <X size={13} className="text-slate-400 hover:text-red-400 shrink-0" onClick={clear} />}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          dir="rtl"
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden', zIndex: 9999 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg w-56 p-2 text-sm"
        >
          <div className="flex flex-col gap-0.5">
            {PRESET_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreset(key)}
                className="text-right px-2.5 py-1.5 rounded-md hover:bg-[#E8F1FB] dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-[#0C447C] dark:hover:text-blue-400 transition-colors"
              >
                {t(`presets.${key}`)}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-gray-800 mt-1.5 pt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                dir="ltr"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label={t('from')}
                className="flex-1 min-w-0 border border-slate-200 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500"
              />
              <span className="text-slate-300 text-xs shrink-0">—</span>
              <input
                type="date"
                dir="ltr"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                aria-label={t('to')}
                className="flex-1 min-w-0 border border-slate-200 dark:border-gray-700 rounded-md px-1.5 py-1 text-xs bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              {value.from || value.to ? (
                <button type="button" onClick={clear} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  {t('clear')}
                </button>
              ) : <span />}
              <button
                type="button"
                onClick={applyCustom}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#0C447C] hover:bg-[#0a3a6b] text-white transition-colors"
              >
                {t('apply')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
