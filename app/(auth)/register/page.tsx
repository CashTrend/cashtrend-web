'use client'

/**
 * Register page — creates a Firebase Auth account, then registers the user
 * on the CashTrend backend.
 *
 * Flow:
 *   1. User submits email + username + password (+ optional profile picture)
 *   2. Firebase Auth creates the account → returns uid
 *   3. POST /api/users/register with { user_auth_id: uid, username, profile_picture? }
 *   4. Store username in localStorage (ct_username) for future logins
 *   5. Store refresh token in httpOnly cookie via POST /api/auth/set-cookie
 *   6. Redirect to dashboard
 *
 * On backend errors (duplicate username/uid), the Firebase account has already
 * been created. This is acceptable for now — a production app would delete the
 * Firebase account on backend failure.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, TrendingUp } from 'lucide-react'
import { firebaseSignUp } from '@/lib/auth/firebase-helpers'
import { register as registerUser } from '@/services/auth.service'
import { Button, Input, Label, FormError } from '@/components/ui'
import type { ApiValidationError } from '@/lib/types'

const registerSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be 50 characters or fewer')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Only letters, numbers, underscores, dots, and hyphens allowed'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

/** Extract a readable message from a backend validation error body. */
function extractBackendError(body: unknown): string {
  if (typeof body !== 'object' || body === null) return 'Registration failed. Please try again.'
  const err = body as ApiValidationError
  const messages = Object.values(err).flat()
  return messages[0] ?? 'Registration failed. Please try again.'
}

export default function RegisterPage() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)

    try {
      // Step 1: Create Firebase Auth account
      const credential = await firebaseSignUp(values.email, values.password)
      const uid = credential.user.uid

      // Step 2: Register on the CashTrend backend
      const authData = await registerUser({
        user_auth_id: uid,
        username: values.username,
      })

      // Step 3: Persist username locally for future logins
      localStorage.setItem('ct_username', values.username)

      // Step 4: Persist the refresh token and user profile as cookies
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: authData.refresh, user: authData.user }),
      })

      // Step 5: Redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'body' in error &&
        typeof (error as { status?: unknown }).status === 'number'
      ) {
        const httpErr = error as { status: number; body: unknown }
        if (httpErr.status === 400) {
          setFormError(extractBackendError(httpErr.body))
          return
        }
      }
      setFormError(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      )
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="text-sm text-text-secondary">Start tracking your portfolio today</p>
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
          <Label htmlFor="username" required>
            Username
          </Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="your_username"
            leftIcon={<User size={16} />}
            error={errors.username?.message}
            {...register('username')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword" required>
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} leftIcon={<TrendingUp size={16} />}>
          Create account
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
