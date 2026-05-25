/**
 * Auth service — wraps all user authentication endpoints.
 *
 * Endpoints covered:
 *   POST /api/users/login
 *   POST /api/users/register
 *   POST /api/users/api/token/refresh/
 *
 * NOTE: This service does NOT handle Firebase Auth directly.
 * The caller is responsible for authenticating with Firebase first and
 * passing the resulting UID as `user_auth_id`.
 */

import { http, setAccessToken } from '@/services/http'
import type { AuthResponse, LoginRequest, RegisterRequest, TokenRefreshResponse } from '@/lib/types'

/**
 * Authenticate an existing user against the backend.
 * The caller must obtain `user_auth_id` from Firebase Auth before calling this.
 *
 * On success, automatically stores the access token in memory.
 * The caller is responsible for persisting the refresh token via the
 * /api/auth/set-cookie Route Handler.
 *
 * @param payload - Login credentials
 * @returns AuthResponse containing tokens and user data
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const data = await http.post<AuthResponse>('/api/users/login', payload, false)
  setAccessToken(data.access)
  return data
}

/**
 * Register a new user on the backend.
 * The caller must have already created a Firebase Auth account and must pass
 * the Firebase UID as `user_auth_id`.
 *
 * Supports optional profile_picture upload via multipart/form-data.
 * On success, automatically stores the access token in memory.
 *
 * @param payload - Registration data including optional profile picture
 * @returns AuthResponse containing tokens and newly created user data
 */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  let body: FormData | Omit<RegisterRequest, 'profile_picture'>

  if (payload.profile_picture) {
    // Must use multipart/form-data when uploading a file
    const formData = new FormData()
    formData.append('user_auth_id', payload.user_auth_id)
    formData.append('username', payload.username)
    formData.append('profile_picture', payload.profile_picture)
    body = formData
  } else {
    // Plain JSON when no file is attached
    body = {
      user_auth_id: payload.user_auth_id,
      username: payload.username,
    }
  }

  const data = await http.post<AuthResponse>('/api/users/register', body, false)
  setAccessToken(data.access)
  return data
}

/**
 * Exchange a refresh token for a new access/refresh token pair.
 * This is called directly when the refresh token is available as a string
 * (e.g., from within the Next.js Route Handler that reads the httpOnly cookie).
 *
 * On success, automatically stores the new access token in memory.
 *
 * @param refreshToken - The current refresh token
 * @returns New token pair; the old refresh token is permanently blacklisted
 */
export async function refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const data = await http.post<TokenRefreshResponse>(
    '/api/users/api/token/refresh/',
    { refresh: refreshToken },
    false
  )
  setAccessToken(data.access)
  return data
}
