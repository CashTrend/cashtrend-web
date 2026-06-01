'use client'

/**
 * AuthContext — provides the authenticated user state and auth actions
 * to all client components in the tree.
 *
 * What it manages:
 *   - Current user (from backend, post-login/register)
 *   - In-memory access token hydration on page load (via silent refresh)
 *   - logout() — signs out of Firebase, clears the cookie, clears state
 *
 * What it does NOT manage:
 *   - Firebase Auth state directly (that's handled in the login/register forms)
 *   - Routing/redirects (that's handled by middleware.ts)
 *
 * Usage:
 *   Wrap the (dashboard) layout with <AuthProvider>.
 *   In client components: const { user, logout } = useAuth()
 */

import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react'
import { setAccessToken, clearAccessToken } from '@/services/http'
import { firebaseSignOut } from '@/lib/auth/firebase-helpers'
import type { User } from '@/lib/types'

/** Name of the plain (JS-readable) cookie that stores the user profile. */
const USER_COOKIE_NAME = 'cashtrend_user'

/**
 * Read and parse the user profile from the cashtrend_user cookie.
 * Returns null if the cookie is absent or malformed.
 */
function readUserFromCookie(): User | null {
  try {
    const match = document.cookie.split('; ').find((c) => c.startsWith(`${USER_COOKIE_NAME}=`))
    if (!match) return null
    const json = decodeURIComponent(match.slice(USER_COOKIE_NAME.length + 1))
    return JSON.parse(json) as User
  } catch {
    return null
  }
}

interface AuthContextValue {
  /** The authenticated backend user, or null if not yet loaded. */
  user: User | null
  /** True while the initial session hydration is in progress. */
  isLoading: boolean
  /** Set the user after a successful login or register. */
  setUser: (user: User) => void
  /** Sign out: clears Firebase session, httpOnly cookie, and in-memory token. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Hook to access the auth context.
 * Must be used inside a component tree wrapped by <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
  /** Pre-hydrated user from a Server Component (optional optimisation). */
  initialUser?: User | null
}

/**
 * AuthProvider — mount this in the (dashboard) layout.
 * On mount, attempts a silent token refresh to restore the access token
 * in memory after a page reload (the refresh token lives in the httpOnly cookie).
 */
export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  // If initialUser is provided, we're already hydrated — no loading state needed
  const [isLoading, setIsLoading] = useState(initialUser === null)

  /** Hydrate the in-memory access token from the httpOnly refresh cookie. */
  useEffect(() => {
    // Skip hydration if the user was pre-loaded by a Server Component
    if (initialUser !== null) return

    let cancelled = false

    async function hydrate() {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!res.ok || cancelled) return

        const data: { access: string } = await res.json()
        if (!cancelled) {
          setAccessToken(data.access)
          // Restore the user profile from the plain cookie (set at login/register)
          const savedUser = readUserFromCookie()
          if (savedUser && !cancelled) setUser(savedUser)
        }
      } catch {
        // No valid cookie — user is not authenticated; middleware will redirect
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [initialUser])

  const logout = useCallback(async () => {
    // 1. Sign out of Firebase.
    //    Wrapped in try/catch so that a Firebase network error (e.g. the SDK
    //    is temporarily unavailable) does not abort the remaining cleanup steps.
    //    Leaving the httpOnly refresh cookie alive would allow further backend
    //    API calls even after the user believes they have logged out.
    try {
      await firebaseSignOut()
    } catch {
      // Ignore — always proceed to clear the local session regardless.
    }

    // 2. Clear the httpOnly refresh cookie via the Next.js Route Handler.
    await fetch('/api/auth/logout', { method: 'POST' })

    // 3. Clear the in-memory access token.
    clearAccessToken()

    // 4. Clear user state.
    setUser(null)

    // 5. Redirect to login (full navigation to clear any remaining client state).
    window.location.href = '/login'
  }, [])

  return <AuthContext value={{ user, isLoading, setUser, logout }}>{children}</AuthContext>
}
