'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { success, error: showError } = useToast()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) {
        showError(error.message)
        return
      }

      success('Account created! Redirecting to setup...')
      router.push('/onboarding')
      router.refresh()
    } catch {
      showError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
          Create your account 🚀
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
          Start your journey to smarter studying
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="register-name"
          label="Full Name"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={<User className="w-4 h-4" />}
          autoComplete="name"
        />

        <Input
          id="register-email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            id="register-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            helperText="At least 6 characters"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          id="register-confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          icon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark flex flex-col gap-3">
        <span>
          Already have an account?{' '}
          <Link href="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
            Sign in
          </Link>
        </span>
        <button
          type="button"
          onClick={() => setIsTutorialOpen(true)}
          className="text-xs text-text-muted-light dark:text-text-muted-dark hover:text-primary-500 font-medium inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
        >
          <Play className="w-3.5 h-3.5" /> Watch Registration & Onboarding Tutorial
        </button>
      </p>

      {/* Tutorial Video Modal */}
      <Modal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="How to Register & Get Started" size="xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-border-light dark:border-border-dark bg-black flex items-center justify-center relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/videos/registration_tutorial.webp" 
              alt="Registration & Onboarding Tutorial" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
            This short video walks you through creating your account and completing your onboarding configuration to access the Smart Start dashboard.
          </p>
        </div>
      </Modal>
    </div>
  )
}
