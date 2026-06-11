import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { AuthProvider } from '@/core/auth/auth.provider'

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
          default: {
            numberingSystem: 'latn',
          },
        },
        dateTime: {
          default: {
            numberingSystem: 'latn',
          },
        },
      }}
    >
      <AuthProvider>
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          lang={locale}
        >
          {children}
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}