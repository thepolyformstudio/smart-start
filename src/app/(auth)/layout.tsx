import React from 'react'
import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg-animated" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <Logo size="xl" className="mb-8" />
          <h1 className="text-4xl font-extrabold mb-4 text-center leading-tight">
            Plan. Learn. Achieve.
          </h1>
          <p className="text-lg text-white/80 text-center max-w-md leading-relaxed">
            Your personal study companion that helps you build better habits,
            track progress, and ace your exams.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">📚</div>
              <div className="text-sm mt-2 text-white/70">Track Subjects</div>
            </div>
            <div>
              <div className="text-3xl font-bold">🔥</div>
              <div className="text-sm mt-2 text-white/70">Build Streaks</div>
            </div>
            <div>
              <div className="text-3xl font-bold">🎯</div>
              <div className="text-sm mt-2 text-white/70">Ace Exams</div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-bg-light dark:bg-bg-dark">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
