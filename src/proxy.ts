import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

const AUTH_PATHS = [
  '/ar/dashboard',
  '/en/dashboard',
  '/ar/superadmin',
  '/en/superadmin',
]

function isAuthRequired(pathname: string): boolean {
  return AUTH_PATHS.some(path => pathname.startsWith(path))
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isAuthRequired(pathname)) {
    const refreshToken = request.cookies.get('sefay_refresh')

    if (!refreshToken) {
      const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}