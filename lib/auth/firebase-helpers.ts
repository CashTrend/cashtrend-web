/**
 * Firebase Auth helpers — thin wrappers around the Firebase SDK.
 *
 * These functions handle the Firebase side of authentication only.
 * After a successful Firebase operation, the caller must also call the
 * backend (auth.service.ts) to get the CashTrend JWT tokens.
 *
 * Firebase errors are caught and re-thrown as human-readable strings
 * so UI components can display them directly.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type UserCredential,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/auth/firebase'

/** Human-readable messages for common Firebase Auth error codes. */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/user-disabled': 'This account has been disabled.',
}

/**
 * Map a Firebase Auth error code to a user-friendly message.
 * Falls back to the raw error message if the code is not mapped.
 */
function toReadableError(error: unknown): string {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    return FIREBASE_ERROR_MESSAGES[code] ?? 'An unexpected error occurred. Please try again.'
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Sign in an existing user with Firebase Auth.
 * Returns the UserCredential on success.
 * Throws a human-readable string on failure.
 *
 * @param email - User's email address
 * @param password - User's password
 */
export async function firebaseSignIn(email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  } catch (error) {
    throw new Error(toReadableError(error))
  }
}

/**
 * Create a new Firebase Auth account.
 * Returns the UserCredential on success (credential.user.uid = user_auth_id).
 * Throws a human-readable string on failure.
 *
 * @param email - User's email address
 * @param password - User's password
 */
export async function firebaseSignUp(email: string, password: string): Promise<UserCredential> {
  try {
    return await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  } catch (error) {
    throw new Error(toReadableError(error))
  }
}

/**
 * Sign out the current user from Firebase Auth.
 * The caller is also responsible for clearing the backend session
 * (POST /api/auth/logout to clear the httpOnly cookie).
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    await fbSignOut(getFirebaseAuth())
  } catch {
    // Sign-out errors are non-critical — swallow and continue
  }
}
