/**
 * Server-side session management.
 *
 * Handles reading and writing the httpOnly refresh token cookie,
 * and a plain (JS-readable) user profile cookie.
 *
 * These functions must only run in server contexts (Route Handlers, Server Components,
 * middleware) — they use next/headers which is not available client-side.
 *
 * Cookies:
 *   cashtrend_refresh  — httpOnly, Secure in prod, SameSite=Strict, MaxAge=1 day
 *   cashtrend_user     — NOT httpOnly (readable by JS), SameSite=Strict, MaxAge=1 day
 *                        Contains JSON: { user_auth_id, username, profile_picture }
 *                        Used by AuthProvider to restore user state after page reload
 *                        without needing a /me API endpoint.
 */

import { cookies } from 'next/headers'
import type { User } from '@/lib/types'

/** Name of the httpOnly cookie that stores the refresh token. */
export const REFRESH_COOKIE_NAME = 'cashtrend_refresh'

/** Name of the plain cookie that stores the serialised user profile. */
export const USER_COOKIE_NAME = 'cashtrend_user'

/** Max age in seconds — matches the backend's 1-day refresh token lifetime. */
const COOKIE_MAX_AGE = 60 * 60 * 24 // 86400 seconds

/**
 * Persist the refresh token as an httpOnly cookie.
 * Call this after a successful login, register, or token refresh.
 *
 * @param refreshToken - The JWT refresh token to store
 */
export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

/**
 * Read the refresh token from the httpOnly cookie.
 * Returns null if no cookie is present (user is not authenticated).
 *
 * @returns The stored refresh token, or null if absent
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(REFRESH_COOKIE_NAME)
  return cookie?.value ?? null
}

/**
 * Delete the refresh token cookie.
 * Call this on logout to invalidate the server-side session.
 */
export async function clearRefreshTokenCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(REFRESH_COOKIE_NAME)
}

/**
 * Check whether a refresh token cookie exists (does not validate the token).
 * Useful in middleware to quickly determine if a user might have a valid session.
 *
 * @returns true if the cookie is present
 */
export async function hasRefreshTokenCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.has(REFRESH_COOKIE_NAME)
}

/**
 * Persist the user profile as a plain (JS-readable) cookie.
 * Call this alongside setRefreshTokenCookie after login/register.
 *
 * Not httpOnly — intentionally readable by JavaScript so AuthProvider can
 * restore the user state after a page reload without a /me round-trip.
 *
 * @param user - The authenticated user object to serialise
 */
export async function setUserCookie(user: User): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

/**
 * Delete the user profile cookie.
 * Call this on logout alongside clearRefreshTokenCookie.
 */
export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(USER_COOKIE_NAME)
}
