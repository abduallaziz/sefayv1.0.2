"use client"; // هذه السطر يخبر Next.js أن المكون يعمل في المتصفح فقط

import { useEffect } from 'react';

export default function GlobalInputFix() {
  useEffect(() => {
    // دالة تحويل الأرقام العربية والفارسية إلى إنجليزية
    const toEnglishDigits = (str: string) => {
      return str.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (c) => 
        String.fromCharCode(c.charCodeAt(0) - (c.charCodeAt(0) >= 1776 ? 1728 : 1584))
      );
    };

    const handleGlobalInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (
        target && 
        target.tagName === 'INPUT' && 
        ['text', 'number', 'tel', 'password'].includes(target.type)
      ) {
        const originalValue = target.value;
        const convertedValue = toEnglishDigits(originalValue);
        
        if (originalValue !== convertedValue) {
          target.value = convertedValue;
          // إطلاق حدث التغيير لتحديث الـ State الخاص بـ React تلقائياً
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    window.addEventListener('input', handleGlobalInput);
    return () => window.removeEventListener('input', handleGlobalInput);
  }, []);

  return null;
}
