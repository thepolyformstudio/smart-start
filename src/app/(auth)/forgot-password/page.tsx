'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { success, error: showError } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email'); return }

    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        showError(resetError.message)
        return
      }

      setSent(true)
      success('Password reset email sent!')
    } catch {
      showError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-secondary-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-3">
          Check your email 📧
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
          We&apos;ve sent a password reset link to <strong>{email}</strong>
        </p>
        <Link href="/login">
          <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
          Forgot password? 🔑
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
          No worries! Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="forgot-email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          icon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Send Reset Link
        </Button>
      </form>

      <p className="mt-8 text-center">
        <Link href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </p>
    </div>
  )
}
