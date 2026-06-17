'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

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
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromYMD(s));
}

type ActiveField = 'from' | 'to' | null;
type CalView = 'days' | 'months' | 'years';

export function DateRangePicker({ value, onChange, placeholder, align = 'right' }: Props) {
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

  const ref = useRef<HTMLDivElement>(null);

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
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  const fieldBase = 'flex-1 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors';
  const fieldActive = 'border-[#0C447C] bg-[#E8F1FB] dark:border-blue-500 dark:bg-blue-500/10 text-slate-800 dark:text-white';
  const fieldIdle = 'border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-white hover:border-slate-300';
  const navBtnClass = 'px-2 py-0.5 text-sm font-semibold rounded-lg transition-colors text-slate-800 dark:text-white hover:bg-[#E8F1FB] dark:hover:bg-blue-500/10 hover:text-[#0C447C] dark:hover:text-blue-400';
  const navActiveCls = 'text-[#0C447C] dark:text-blue-400 bg-[#E8F1FB] dark:bg-blue-500/10';

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
    <div ref={ref} className="relative inline-block" dir="rtl">
      <button
        onClick={() => { setOpen(o => !o); if (!open) setActiveField('from'); }}
        className="flex items-center gap-2 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white hover:border-[#0C447C] dark:hover:border-blue-500 transition-colors min-w-[240px]"
      >
        <Calendar size={15} className="text-slate-400 shrink-0" />
        <span className="flex-1 text-right truncate">
          {display ?? <span className="text-slate-400">{placeholder ?? t('placeholder')}</span>}
        </span>
        {display && <X size={14} className="text-slate-400 hover:text-red-400 shrink-0" onClick={clear} />}
      </button>

      {open && (
        <div className={`absolute z-50 mt-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl flex ${align === 'right' ? 'right-0' : 'left-0'}`}>

          {/* Presets */}
          <div className="w-36 border-l border-slate-100 dark:border-gray-800 p-2 flex flex-col gap-0.5">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => handlePreset(p)}
                className="text-right text-sm px-3 py-1.5 rounded-lg hover:bg-[#E8F1FB] dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-[#0C447C] dark:hover:text-blue-400 transition-colors">
                {t(`presets.${p.key}` as any)}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-4 w-72 flex flex-col gap-3">

            {/* From / To */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">{t('from')}</p>
                <div onClick={() => handleFieldClick('from', value.from)} className={`${fieldBase} ${activeField === 'from' ? fieldActive : fieldIdle}`}>
                  {value.from ? formatLabel(value.from, locale) : <span className="text-slate-400">{t('selectFrom')}</span>}
                </div>
              </div>
              <span className="text-slate-300 mt-4">—</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">{t('to')}</p>
                <div onClick={() => handleFieldClick('to', value.to)} className={`${fieldBase} ${activeField === 'to' ? fieldActive : fieldIdle}`}>
                  {value.to ? formatLabel(value.to, locale) : <span className="text-slate-400">{t('selectTo')}</span>}
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={handleNavPrev} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-800">
                <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
              </button>

              <div className="flex items-center gap-1">
                {cv === 'years' ? (
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
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

              <button onClick={handleNavNext} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-800">
                <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* DAYS */}
            {cv === 'days' && (
              <>
                <div className="grid grid-cols-7">
                  {dayNames.map(d => <div key={d} className="text-center text-xs text-slate-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 -mt-2">
                  {cells.map((ymd, i) => {
                    if (!ymd) return <div key={i} />;
                    const state = getDayState(ymd);
                    const isStartEnd = state === 'start' || state === 'end' || state === 'single';
                    const inRange = state === 'in-range';
                    return (
                      <div key={ymd} className={`relative flex items-center justify-center ${inRange ? 'bg-[#E8F1FB] dark:bg-blue-500/10' : ''}`}>
                        <button
                          onClick={() => handleDayClick(ymd)}
                          onMouseEnter={() => setHovered(ymd)}
                          onMouseLeave={() => setHovered(null)}
                          className={`w-8 h-8 text-xs rounded-full transition-colors z-10 font-medium
                            ${isStartEnd ? 'bg-[#0C447C] text-white' : inRange ? 'text-[#0C447C] dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
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
                      ${i === viewMonth ? 'bg-[#0C447C] text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-[#E8F1FB] dark:hover:bg-blue-500/10 hover:text-[#0C447C]'}`}>
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
                      ${y === viewYear ? 'bg-[#0C447C] text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-[#E8F1FB] dark:hover:bg-blue-500/10 hover:text-[#0C447C]'}`}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-gray-800">
              <p className="text-xs text-slate-400">
                {activeField === 'from' ? t('selectFrom') : activeField === 'to' ? t('selectEnd') : ''}
              </p>
              {(value.from || value.to) && (
                <button onClick={clear} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  {t('clear')}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}