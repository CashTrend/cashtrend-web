/**
 * Firebase client SDK initialization.
 *
 * Uses a lazy singleton pattern — Firebase is only initialized when first
 * accessed from client-side code. This prevents crashes during SSR/SSG
 * prerender when environment variables may not be available at module
 * evaluation time.
 *
 * Required environment variables (all NEXT_PUBLIC_ — safe for client-side):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * Usage:
 *   import { getFirebaseAuth } from '@/lib/auth/firebase'
 *   const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

let _app: FirebaseApp | null = null
let _auth: Auth | null = null

/**
 * Returns the lazy-initialized Firebase Auth instance.
 * Must only be called from client-side code (inside event handlers,
 * useEffect, or async functions triggered by user interaction).
 *
 * Throws if called during SSR to surface misconfiguration early.
 */
export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error(
      '[firebase] getFirebaseAuth() was called server-side. ' +
        'Firebase Auth is a client-only SDK.'
    )
  }

  if (!_auth) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    _auth = getAuth(_app)
  }

  return _auth
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
}
