import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { AuthProvider } from '@/core/auth/auth.provider'
import { useEffect } from 'react'

// مكون داخلي لمراقبة جميع الحقول وتحويل الأرقام إلى إنجليزية برمجياً فوراً
function GlobalInputFix() {
  useEffect(() => {
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

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()
  const isArabic = locale === 'ar'

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      formats={{
        number: {
          currency: {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        },
      }}
    >
      <AuthProvider>
        {/* تشغيل مراقب الحقول الشامل للموقع */}
        <GlobalInputFix />
        
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          lang={locale}
          className={isArabic ? 'font-cairo' : 'font-inter'}
        >
          {children}
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
