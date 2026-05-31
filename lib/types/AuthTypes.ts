/**
 * Auth domain types — mirrors the users/ app API contracts.
 */

/** Authenticated user returned by login/register endpoints. */
export interface User {
  user_auth_id: string
  username: string
  /** Absolute URL to profile picture, or null if not set. */
  profile_picture: string | null
}

/** Response shape for both login and register endpoints. */
export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

/**
 * Request body for POST /api/users/login.
 *
 * Only the Firebase UID is required. Username is NOT sent during login so
 * that users can authenticate from any device without relying on data that
 * was previously stored in localStorage on a specific browser.
 */
export interface LoginRequest {
  user_auth_id: string
}

/** Request body for POST /api/users/register */
export interface RegisterRequest {
  user_auth_id: string
  username: string
  /** Optional profile picture file — requires multipart/form-data. */
  profile_picture?: File | null
}

/** Request body for POST /api/users/api/token/refresh/ */
export interface TokenRefreshRequest {
  refresh: string
}

/** Response shape for POST /api/users/api/token/refresh/ */
export interface TokenRefreshResponse {
  access: string
  refresh: string
}

/** Generic DRF field-level validation error shape. */
export interface ApiValidationError {
  [field: string]: string[]
}

/** Generic DRF detail error shape (404, 403, 401, etc.). */
export interface ApiDetailError {
  detail: string
  code?: string
}

/** Union of possible API error shapes. */
export type ApiError = ApiValidationError | ApiDetailError
