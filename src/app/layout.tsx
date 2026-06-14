import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from '@/core/providers'
import { ForceLatinNumbers } from '@/components/ForceLatinNumbers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'Sefay — Enterprise SaaS',
  description: 'Universal Business Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className={`${inter.variable} ${cairo.variable}`}>
        <ForceLatinNumbers />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}