'use client'

/**
 * LoginForm — the interactive login form.
 *
 * Separated from page.tsx so that useSearchParams() can be wrapped
 * in a Suspense boundary at the page level (Next.js requirement).
 *
 * Flow:
 *   1. User submits email + password.
 *   2. Firebase Auth validates credentials → returns the user's UID.
 *   3. POST /api/users/login with { user_auth_id: uid }.
 *      No username is needed — the backend looks up the account by UID alone,
 *      so login works from any device or browser without stored local data.
 *   4. Store refresh token in httpOnly cookie via POST /api/auth/set-cookie.
 *   5. Redirect to dashboard (or the originally requested page).
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, TrendingUp } from 'lucide-react'
import { firebaseSignIn } from '@/lib/auth/firebase-helpers'
import { login } from '@/services/auth.service'
import { Button, Input, Label, FormError } from '@/components/ui'

/** Zod schema — email + password are the only fields the user provides. */
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  /** Where to redirect after a successful login (defaults to dashboard root). */
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      // Step 1: Verify the user's credentials with Firebase Auth.
      // On success we receive the Firebase UID — the sole identifier needed
      // to look up the account on the backend.
      const credential = await firebaseSignIn(values.email, values.password)
      const uid = credential.user.uid

      // Step 2: Authenticate with the CashTrend backend using only the UID.
      // The backend resolves the user record exclusively by user_auth_id, so
      // no username or other locally stored data is required here.
      const authData = await login({ user_auth_id: uid })

      // Step 3: Persist the refresh token and user profile as server-side cookies
      // via the Next.js Route Handler so they are never exposed to client JS.
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: authData.refresh, user: authData.user }),
      })

      // Step 4: Navigate to the intended destination and force a server re-render
      // so the middleware picks up the newly set cookies.
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      // Surface both Firebase errors (human-readable messages from firebase-helpers.ts)
      // and backend errors (HttpError.message) in the same banner.
      setFormError(error instanceof Error ? error.message : 'Login failed. Please try again.')
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary">Sign in to your CashTrend account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} leftIcon={<TrendingUp size={16} />}>
          Sign in
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
