/**
 * Core HTTP client for the CashTrend backend API.
 *
 * Responsibilities:
 * - Attach Authorization header with access token on every authenticated request
 * - On 401, attempt a silent token refresh and retry the original request once
 * - On refresh failure, redirect to /login (client-side) or throw (server-side)
 * - Provide typed generic methods: get, post, put, patch, del
 *
 * Token storage strategy:
 * - Access token: module-level variable (memory only, cleared on page reload)
 * - Refresh token: httpOnly cookie managed by the /api/auth/set-cookie Route Handler
 */

import type { TokenRefreshResponse } from '@/lib/types'

/** Module-level access token — in memory only, never persisted to storage. */
let accessToken: string | null = null

/** Whether a refresh is already in-flight (prevents concurrent refresh races). */
let isRefreshing = false

/** Queue of callbacks waiting for the refreshed token. */
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> =
  []

/**
 * Set the in-memory access token.
 * Called after login, register, or a successful token refresh.
 */
export function setAccessToken(token: string): void {
  accessToken = token
}

/**
 * Clear the in-memory access token.
 * Called on logout.
 */
export function clearAccessToken(): void {
  accessToken = null
}

/**
 * Retrieve the current in-memory access token.
 */
export function getAccessToken(): string | null {
  return accessToken
}

/** Notify all queued requests with the new token after a refresh completes. */
function onRefreshComplete(newToken: string): void {
  refreshSubscribers.forEach(({ resolve }) => resolve(newToken))
  refreshSubscribers = []
}

/** Reject all queued requests when refresh fails. */
function onRefreshFailed(err: Error): void {
  refreshSubscribers.forEach(({ reject }) => reject(err))
  refreshSubscribers = []
}

/**
 * Silently refresh the access token using the httpOnly refresh token cookie.
 * The cookie is sent automatically by the browser on same-origin requests.
 * Returns the new access token, or throws if the refresh fails.
 */
async function refreshAccessToken(): Promise<string> {
  // Call our internal Next.js Route Handler which reads the httpOnly cookie
  // and proxies the refresh request to the Django backend.
  const res = await fetch('/api/auth/refresh', { method: 'POST' })

  if (!res.ok) {
    throw new Error('Token refresh failed')
  }

  const data: TokenRefreshResponse = await res.json()
  setAccessToken(data.access)
  return data.access
}

/** Determine the correct base URL depending on execution environment. */
function getBaseUrl(): string {
  // Server-side (Route Handlers, Server Components): call Django directly
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
  }
  // Client-side: route through the Next.js rewrite proxy (same-origin, no CORS)
  return '/api/proxy'
}

/**
 * Internal fetch wrapper.
 * Attaches the Authorization header and handles 401 with automatic token refresh.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const url = `${getBaseUrl()}${path}`

  const headers = new Headers(options.headers)

  if (authenticated && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  // Only set Content-Type to JSON if the body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...options, headers })

  // Happy path
  if (response.ok) {
    // Handle 204 No Content (DELETE responses)
    if (response.status === 204) {
      return undefined as T
    }
    return response.json() as Promise<T>
  }

  // Handle 401: attempt token refresh once
  if (response.status === 401 && authenticated) {
    if (isRefreshing) {
      // Another refresh is already in-flight — queue this request
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push({
          resolve: async (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`)
            try {
              const retryRes = await fetch(url, { ...options, headers })
              if (retryRes.ok) {
                resolve(retryRes.status === 204 ? (undefined as T) : retryRes.json())
              } else {
                reject(new HttpError(retryRes.status, await retryRes.json()))
              }
            } catch (err) {
              reject(err)
            }
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      isRefreshing = false
      onRefreshComplete(newToken)

      // Retry the original request with the new token
      headers.set('Authorization', `Bearer ${newToken}`)
      const retryResponse = await fetch(url, { ...options, headers })

      if (retryResponse.ok) {
        return retryResponse.status === 204 ? (undefined as T) : retryResponse.json()
      }

      throw new HttpError(retryResponse.status, await retryResponse.json())
    } catch {
      isRefreshing = false
      // Reject all queued requests so their Promises don't hang forever
      const err = new Error('Session expired. Please log in again.')
      onRefreshFailed(err)

      // Refresh failed — clear the stale token and redirect to login
      clearAccessToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw err
    }
  }

  // All other error statuses
  let errorBody: unknown
  try {
    errorBody = await response.json()
  } catch {
    errorBody = { detail: response.statusText }
  }

  throw new HttpError(response.status, errorBody)
}

/**
 * Typed HTTP error that carries the response status and parsed body.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
  }
}

/**
 * HTTP client — use these methods in service files.
 * All methods are generic: pass the expected response type as T.
 */
export const http = {
  /**
   * GET request.
   * @param path - API path (e.g. '/api/tickers/AAPL/detail')
   * @param params - Optional query parameters
   * @param authenticated - Whether to attach the Bearer token (default: true)
   */
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    authenticated = true
  ): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()}`
      : path
    return request<T>(url, { method: 'GET' }, authenticated)
  },

  /**
   * POST request with JSON or FormData body.
   * @param path - API path
   * @param body - Request body (will be JSON-serialized unless FormData)
   * @param authenticated - Whether to attach the Bearer token (default: true)
   */
  post<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
    return request<T>(
      path,
      {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      authenticated
    )
  },

  /**
   * PUT request (full update).
   * @param path - API path
   * @param body - Full replacement body
   */
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  /**
   * PATCH request (partial update).
   * @param path - API path
   * @param body - Partial update body
   */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  /**
   * DELETE request.
   * @param path - API path
   */
  del<T = void>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}
