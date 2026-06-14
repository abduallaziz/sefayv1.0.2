'use client';

import { useEffect } from 'react';

export function ForceLatinNumbers() {
  useEffect(() => {
    const toLatinDigits = (str: string) =>
      str
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (!target || !('value' in target)) return;

      const arabicDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
      if (arabicDigits.includes(e.key)) {
        e.preventDefault();
        const latinKey = toLatinDigits(e.key);
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        const newValue =
          target.value.slice(0, start) + latinKey + target.value.slice(end);
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        nativeInputValueSetter?.call(target, newValue);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.setSelectionRange(start + 1, start + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return null;
}