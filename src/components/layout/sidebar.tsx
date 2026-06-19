'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import {
  LayoutDashboard, BookOpen, Calendar, Clock, Brain,
  BarChart3, AlertCircle, MessageSquare, User, Settings,
  Award, CreditCard, Target, X, LogOut, Shield, Info, MessageSquareHeart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  name: string
  avatar_url: string | null
  xp: number
  level: number
  streak_days: number
  is_admin: boolean
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/subjects', icon: BookOpen, label: 'Subjects' },
  { href: '/planner', icon: Calendar, label: 'Study Planner' },
  { href: '/timer', icon: Clock, label: 'Timer' },
  { href: '/revision', icon: Brain, label: 'Revision' },
  { href: '/exams', icon: Target, label: 'Exams' },
  { href: '/mistakes', icon: AlertCircle, label: 'Mistake Log' },
  { href: '/reflection', icon: MessageSquare, label: 'Reflection' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/profile', icon: Award, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/subscription', icon: CreditCard, label: 'Premium' },
  { href: '/feedback', icon: MessageSquareHeart, label: 'Feedback' },
  { href: '/about', icon: Info, label: 'About' },
]

export function Sidebar({ isOpen, onClose, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-surface-light dark:bg-surface-dark
          border-r border-border-light dark:border-border-dark
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border-light dark:border-border-dark">
          <Logo size="sm" />
          <button onClick={onClose} className="lg:hidden text-text-muted-light dark:text-text-muted-dark cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}

          {profile?.is_admin && (
            <>
              <div className="my-3 border-t border-border-light dark:border-border-dark" />
              <Link
                href="/admin"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${pathname.startsWith('/admin')
                    ? 'bg-danger-500 text-white'
                    : 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                  }
                `}
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border-light dark:border-border-dark">
          {profile && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                {profile.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                  {profile.name || 'Student'}
                </p>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  Level {profile.level} · {profile.xp} XP
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
