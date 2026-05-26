/**
 * Next.js Proxy (formerly Middleware) — route protection.
 *
 * Renamed from middleware.ts to proxy.ts per Next.js 16 convention.
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * Rules:
 *   - Unauthenticated users (no refresh cookie) are redirected to /login
 *     when they try to access any route under (dashboard).
 *   - Authenticated users (refresh cookie present) are redirected from
 *     /login and /register to / (dashboard).
 *   - /api/auth/* routes are always allowed through (they manage the cookie).
 *
 * Note: The presence of the cookie is used as a proxy for "authenticated".
 * The cookie's actual validity is verified by the Route Handler on first use.
 * This keeps middleware fast (no network calls).
 */

import { NextRequest, NextResponse } from 'next/server'
import { REFRESH_COOKIE_NAME } from '@/lib/auth/session'

/** Routes that do not require authentication. */
const PUBLIC_PATHS = ['/login', '/register']

/** Route prefixes that are always allowed (API, Next internals). */
const ALWAYS_ALLOWED_PREFIXES = ['/api/', '/_next/', '/favicon.ico']

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Always allow internal and API routes
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(REFRESH_COOKIE_NAME)
  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  // Authenticated user trying to access login/register → redirect to dashboard
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  /*
   * Match all routes except:
   * - Static files (_next/static, _next/image, favicon.ico, etc.)
   * - Public API routes handled directly
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
