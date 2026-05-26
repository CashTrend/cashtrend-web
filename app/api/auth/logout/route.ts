/**
 * Route Handler: POST /api/auth/logout
 *
 * Clears both session cookies (refresh token + user profile), effectively
 * ending the server-side session. The client is responsible for clearing
 * the in-memory access token and redirecting to /login.
 *
 * Response 200: { "ok": true }
 */

import { NextResponse } from 'next/server'
import { clearRefreshTokenCookie, clearUserCookie } from '@/lib/auth/session'

export const runtime = 'edge'

export async function POST(): Promise<NextResponse> {
  await clearRefreshTokenCookie()
  await clearUserCookie()
  return NextResponse.json({ ok: true })
}
