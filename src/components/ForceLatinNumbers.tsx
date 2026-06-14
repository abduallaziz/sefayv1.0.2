'use client';

import { useEffect } from 'react';

export function ForceLatinNumbers() {
  useEffect(() => {
    const arabicMap: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    };

    const replaceArabicNumerals = (str: string) =>
      str.replace(/[٠-٩۰-۹]/g, (d) => arabicMap[d] ?? d);

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !('value' in target)) return;
      const converted = replaceArabicNumerals(target.value);
      if (converted !== target.value) {
        const start = (target as HTMLInputElement).selectionStart;
        const end = (target as HTMLInputElement).selectionEnd;
        target.value = converted;
        try {
          (target as HTMLInputElement).setSelectionRange(start, end);
        } catch {}
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    document.addEventListener('input', handleInput, true);
    return () => document.removeEventListener('input', handleInput, true);
  }, []);

  return null;
}