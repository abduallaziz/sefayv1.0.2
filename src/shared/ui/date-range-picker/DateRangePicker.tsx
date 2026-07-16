'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
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
  className?: string;
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
function getLastMonth() {
  const d = new Date();
  return {
    from: toYMD(new Date(d.getFullYear(), d.getMonth()-1, 1)),
    to:   toYMD(new Date(d.getFullYear(), d.getMonth(), 0)),
  };
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function formatLabel(s: string, locale: string) {
  // '-u-nu-latn' forces Western numerals — plain 'ar' renders Arabic-Indic
  // day/year digits, which is exactly what this component exists to avoid.
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromYMD(s));
}

type ActiveField = 'from' | 'to' | null;
type CalView = 'days' | 'months' | 'years';

export function DateRangePicker({ value, onChange, placeholder, className }: Props) {
  const t = useTranslations('datePicker');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [calView, setCalView] = useState<CalView>('days');

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(now.getFullYear() / 12) * 12);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useFloatingPosition(triggerRef, panelRef, open);

  const PRESETS = [
    { key: 'today',       getDates: () => { const d = today(); return { from: d, to: d }; } },
    { key: 'yesterday',   getDates: () => { const d = offsetDay(-1); return { from: d, to: d }; } },
    { key: 'last7',       getDates: () => ({ from: offsetDay(-6), to: today() }) },
    { key: 'last30',      getDates: () => ({ from: offsetDay(-29), to: today() }) },
    { key: 'thisMonth',   getDates: () => ({ from: startOfMonth(), to: today() }) },
    { key: 'lastMonth',   getDates: getLastMonth },
    { key: 'last3months', getDates: () => ({ from: offsetMonth(-3), to: today() }) },
    { key: 'thisYear',    getDates: () => ({ from: startOfYear(), to: today() }) },
  ];

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i))
  );
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i, 1))
  );
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(viewYear, viewMonth, 1));

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false); setActiveField(null); setCalView('days');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  };

  const handleDayClick = useCallback((ymd: string) => {
    if (activeField === 'from' || !activeField) {
      onChange({ from: ymd, to: value.to && value.to >= ymd ? value.to : undefined });
      setActiveField('to');
    } else {
      if (value.from && ymd < value.from) {
        onChange({ from: ymd, to: value.from });
      } else {
        onChange({ from: value.from, to: ymd });
      }
      setActiveField(null);
      setOpen(false);
    }
  }, [activeField, value, onChange]);

  const handleMonthClick = (m: number) => { setViewMonth(m); setCalView('days'); };
  const handleYearClick = (y: number) => { setViewYear(y); setYearRangeStart(Math.floor(y/12)*12); setCalView('days'); };
  const handlePreset = (preset: typeof PRESETS[0]) => { onChange(preset.getDates()); setActiveField(null); setOpen(false); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange({ from: undefined, to: undefined }); setActiveField(null); };
  const handleFieldClick = (field: ActiveField, dateStr?: string) => {
    setActiveField(field); setCalView('days');
    if (dateStr) { setViewYear(fromYMD(dateStr).getFullYear()); setViewMonth(fromYMD(dateStr).getMonth()); }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toYMD(new Date(viewYear, viewMonth, d)));

  const rangeTo = activeField === 'to' && hovered
    ? (value.from && hovered >= value.from ? hovered : value.from)
    : value.to;

  function getDayState(ymd: string) {
    if (!value.from) return 'none';
    const f = value.from;
    const t2 = rangeTo ?? f;
    const [lo, hi] = f <= t2 ? [f, t2] : [t2, f];
    if (ymd === lo && ymd === hi) return 'single';
    if (ymd === lo) return 'start';
    if (ymd === hi) return 'end';
    if (ymd > lo && ymd < hi) return 'in-range';
    return 'none';
  }

  const display = value.from || value.to
    ? [value.from && formatLabel(value.from, locale), value.to && formatLabel(value.to, locale)].filter(Boolean).join(' — ')
    : null;

  // Matrix D5: brand-accent color family (#0C447C / #E8F1FB / blue-* dark
  // tints) reconciled to posCloud-primary tokens. Surface/border/text
  // neutrals below reconciled to posCloud/posCloudDark equivalents.
  // Structure, props, and all date logic above/below this block: untouched.
  const fieldBase = 'flex-1 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors';
  const fieldActive = 'border-posCloud-primary bg-posCloud-primary-light dark:border-posCloud-primary dark:bg-posCloud-primary/10 text-posCloud-text-primary dark:text-posCloudDark-text-primary';
  const fieldIdle = 'border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-surface text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:border-slate-300';
  const navBtnClass = 'px-2 py-0.5 text-sm font-semibold rounded-lg transition-colors text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:bg-posCloud-primary-light dark:hover:bg-posCloud-primary/10 hover:text-posCloud-primary dark:hover:text-posCloud-primary';
  const navActiveCls = 'text-posCloud-primary bg-posCloud-primary-light dark:bg-posCloud-primary/10';

  const cv = calView as string;

  const handleNavPrev = () => {
    if (cv === 'days') nextMonth();
    else if (cv === 'months') setViewYear(y => y - 1);
    else setYearRangeStart(y => y - 12);
  };
  const handleNavNext = () => {
    if (cv === 'days') prevMonth();
    else if (cv === 'months') setViewYear(y => y + 1);
    else setYearRangeStart(y => y + 12);
  };

  return (
    <div ref={triggerRef} className={`relative ${className ? 'block' : 'inline-block'}`} dir="rtl">
      <button
        onClick={() => { setOpen(o => !o); if (!open) setActiveField('from'); }}
        className={`flex items-center gap-2 border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:border-posCloud-primary dark:hover:border-posCloud-primary transition-colors ${className ?? 'min-w-[240px]'}`}
      >
        <Calendar size={15} className="text-posCloud-text-tertiary shrink-0" />
        <span className="flex-1 text-right truncate">
          {display ?? <span className="text-posCloud-text-tertiary">{placeholder ?? t('placeholder')}</span>}
        </span>
        {display && <X size={14} className="text-posCloud-text-tertiary hover:text-posCloud-danger shrink-0" onClick={clear} />}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          dir="rtl"
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden', zIndex: 9999 }}
          className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl flex flex-col sm:flex-row max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto"
        >

          {/* Presets */}
          <div className="w-full sm:w-36 border-b sm:border-b-0 sm:border-l border-posCloud-border dark:border-posCloudDark-border p-2 flex flex-col gap-0.5">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => handlePreset(p)}
                className="text-right text-sm px-3 py-1.5 rounded-lg hover:bg-posCloud-primary-light dark:hover:bg-posCloud-primary/10 text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:text-posCloud-primary dark:hover:text-posCloud-primary transition-colors">
                {t(`presets.${p.key}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-4 w-full sm:w-72 flex flex-col gap-3">

            {/* From / To */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <p className="text-xs text-posCloud-text-tertiary mb-1">{t('from')}</p>
                <div onClick={() => handleFieldClick('from', value.from)} className={`${fieldBase} ${activeField === 'from' ? fieldActive : fieldIdle}`}>
                  {value.from ? formatLabel(value.from, locale) : <span className="text-posCloud-text-tertiary">{t('selectFrom')}</span>}
                </div>
              </div>
              <span className="text-posCloud-text-tertiary mt-4">—</span>
              <div className="flex-1">
                <p className="text-xs text-posCloud-text-tertiary mb-1">{t('to')}</p>
                <div onClick={() => handleFieldClick('to', value.to)} className={`${fieldBase} ${activeField === 'to' ? fieldActive : fieldIdle}`}>
                  {value.to ? formatLabel(value.to, locale) : <span className="text-posCloud-text-tertiary">{t('selectTo')}</span>}
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={handleNavPrev} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40">
                <ChevronRight size={16} className="text-posCloud-text-secondary dark:text-posCloudDark-text-secondary" />
              </button>

              <div className="flex items-center gap-1">
                {cv === 'years' ? (
                  <span className="text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                    {yearRangeStart} — {yearRangeStart + 11}
                  </span>
                ) : (
                  <>
                    <button onClick={() => setCalView('months')} className={`${navBtnClass} ${cv === 'months' ? navActiveCls : ''}`}>
                      {monthLabel}
                    </button>
                    <button onClick={() => setCalView('years')} className={`${navBtnClass} ${cv === 'years' ? navActiveCls : ''}`}>
                      {viewYear}
                    </button>
                  </>
                )}
              </div>

              <button onClick={handleNavNext} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40">
                <ChevronLeft size={16} className="text-posCloud-text-secondary dark:text-posCloudDark-text-secondary" />
              </button>
            </div>

            {/* DAYS */}
            {cv === 'days' && (
              <>
                <div className="grid grid-cols-7">
                  {dayNames.map(d => <div key={d} className="text-center text-xs text-posCloud-text-tertiary py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 -mt-2">
                  {cells.map((ymd, i) => {
                    if (!ymd) return <div key={i} />;
                    const state = getDayState(ymd);
                    const isStartEnd = state === 'start' || state === 'end' || state === 'single';
                    const inRange = state === 'in-range';
                    return (
                      <div key={ymd} className={`relative flex items-center justify-center ${inRange ? 'bg-posCloud-primary-light dark:bg-posCloud-primary/10' : ''}`}>
                        <button
                          onClick={() => handleDayClick(ymd)}
                          onMouseEnter={() => setHovered(ymd)}
                          onMouseLeave={() => setHovered(null)}
                          className={`w-8 h-8 text-xs rounded-full transition-colors z-10 font-medium
                            ${isStartEnd ? 'bg-posCloud-primary text-white' : inRange ? 'text-posCloud-primary' : 'text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40'}`}
                        >
                          {fromYMD(ymd).getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* MONTHS */}
            {cv === 'months' && (
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((name, i) => (
                  <button key={i} onClick={() => handleMonthClick(i)}
                    className={`py-2 text-sm rounded-lg transition-colors capitalize
                      ${i === viewMonth ? 'bg-posCloud-primary text-white font-semibold' : 'text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-primary-light dark:hover:bg-posCloud-primary/10 hover:text-posCloud-primary'}`}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* YEARS */}
            {cv === 'years' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(y => (
                  <button key={y} onClick={() => handleYearClick(y)}
                    className={`py-2 text-sm rounded-lg transition-colors
                      ${y === viewYear ? 'bg-posCloud-primary text-white font-semibold' : 'text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-posCloud-primary-light dark:hover:bg-posCloud-primary/10 hover:text-posCloud-primary'}`}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-posCloud-border dark:border-posCloudDark-border">
              <p className="text-xs text-posCloud-text-tertiary">
                {activeField === 'from' ? t('selectFrom') : activeField === 'to' ? t('selectEnd') : ''}
              </p>
              {(value.from || value.to) && (
                <button onClick={clear} className="text-xs text-posCloud-text-tertiary hover:text-posCloud-danger transition-colors">
                  {t('clear')}
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}