/**
 * Route Handler: POST /api/auth/set-cookie
 *
 * Receives a refresh token and user profile from the client after a successful
 * login/register and stores them as cookies:
 *   - cashtrend_refresh  — httpOnly (not readable by JS, CSRF-safe)
 *   - cashtrend_user     — plain (readable by JS, used to restore user state on reload)
 *
 * Expected request body: { "refresh": "<token>", "user": { ... } }
 * Response: 200 OK with { "ok": true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { setRefreshTokenCookie, setUserCookie } from '@/lib/auth/session'
import type { User } from '@/lib/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('refresh' in body) ||
    typeof (body as Record<string, unknown>)['refresh'] !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing required field: refresh' }, { status: 400 })
  }

  const { refresh, user } = body as { refresh: string; user?: User }

  await setRefreshTokenCookie(refresh)

  if (user && typeof user === 'object' && 'username' in user) {
    await setUserCookie(user)
  }

  return NextResponse.json({ ok: true })
}
