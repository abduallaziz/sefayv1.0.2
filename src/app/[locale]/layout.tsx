import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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
    <NextIntlClientProvider messages={messages}>
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className={isArabic ? 'font-cairo' : 'font-inter'}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}