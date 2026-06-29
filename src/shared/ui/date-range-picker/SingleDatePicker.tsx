'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useFloatingPosition } from './useFloatingPosition';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
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
function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function formatLabel(s: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromYMD(s));
}

type CalView = 'days' | 'months' | 'years';

export function SingleDatePicker({ value, onChange, placeholder, align = 'right', className }: Props) {
  const t = useTranslations('datePicker');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [calView, setCalView] = useState<CalView>('days');

  const now = new Date();
  const initial = value ? fromYMD(value) : now;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(initial.getFullYear() / 12) * 12);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useFloatingPosition(triggerRef, panelRef, open);

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
        setOpen(false); setCalView('days');
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

  const handleDayClick = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };
  const handleMonthClick = (m: number) => { setViewMonth(m); setCalView('days'); };
  const handleYearClick = (y: number) => { setViewYear(y); setYearRangeStart(Math.floor(y/12)*12); setCalView('days'); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(undefined); };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toYMD(new Date(viewYear, viewMonth, d)));

  const display = value ? formatLabel(value, locale) : null;

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
    <div ref={triggerRef} className={`relative inline-block w-full ${className ?? ''}`} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-white hover:border-[#0C447C] dark:hover:border-blue-500 transition-colors w-full"
      >
        <Calendar size={15} className="text-slate-400 shrink-0" />
        <span className="flex-1 text-right truncate">
          {display ?? <span className="text-slate-400">{placeholder ?? t('placeholderSingle')}</span>}
        </span>
        {display && <X size={14} className="text-slate-400 hover:text-red-400 shrink-0" onClick={clear} />}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          dir="rtl"
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden', zIndex: 9999 }}
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-72 flex flex-col gap-3"
        >

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
                  const isSelected = ymd === value;
                  return (
                    <div key={ymd} className="relative flex items-center justify-center">
                      <button
                        onClick={() => handleDayClick(ymd)}
                        className={`w-8 h-8 text-xs rounded-full transition-colors z-10 font-medium
                          ${isSelected ? 'bg-[#0C447C] text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}
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

          {value && (
            <div className="flex items-center justify-end pt-1 border-t border-slate-100 dark:border-gray-800">
              <button onClick={clear} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                {t('clear')}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
