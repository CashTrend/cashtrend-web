/**
 * Route Handler: POST /api/auth/refresh
 *
 * Reads the httpOnly refresh token cookie and proxies a token refresh request
 * to the Django backend. On success, updates the cookie with the new refresh
 * token and returns the new access token to the client.
 *
 * This endpoint is called by the http.ts client automatically on 401 responses.
 *
 * Response 200: { "access": "<new_access_token>", "refresh": "<new_refresh_token>" }
 * Response 401: { "error": "No refresh token" } or backend error
 */

import { NextResponse } from 'next/server'
import {
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '@/lib/auth/session'
import type { TokenRefreshResponse } from '@/lib/types'

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshTokenFromCookie()

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

  let response: Response
  try {
    response = await fetch(`${backendUrl}/api/users/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 })
  }

  if (!response.ok) {
    // Refresh token is invalid or expired — clear the cookie
    await clearRefreshTokenCookie()
    const errorBody = await response.json().catch(() => ({ detail: 'Token refresh failed' }))
    return NextResponse.json(errorBody, { status: 401 })
  }

  const data: TokenRefreshResponse = await response.json()

  // Persist the new refresh token (old one is now blacklisted by the backend)
  await setRefreshTokenCookie(data.refresh)

  return NextResponse.json(data)
}
