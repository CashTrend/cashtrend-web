/**
 * Firebase client SDK initialization.
 *
 * Uses a singleton pattern to avoid re-initializing the app on hot reloads
 * in Next.js development mode.
 *
 * Required environment variables (all NEXT_PUBLIC_ — safe for client-side):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * Usage:
 *   import { firebaseAuth } from '@/lib/auth/firebase'
 *   const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
}

/**
 * Singleton Firebase app instance.
 * Reuses the existing app if already initialized (handles Next.js hot reloads).
 */
const firebaseApp: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

/**
 * Firebase Auth instance — use this in auth flows.
 *
 * @example
 * import { firebaseAuth } from '@/lib/auth/firebase'
 * import { signInWithEmailAndPassword } from 'firebase/auth'
 * const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
 * const uid = credential.user.uid  // This is the user_auth_id for the backend
 */
export const firebaseAuth: Auth = getAuth(firebaseApp)

export { firebaseApp }
