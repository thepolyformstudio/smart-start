'use client'

import React from 'react'
import { Menu, Flame, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

interface Profile {
  id: string
  name: string
  avatar_url: string | null
  xp: number
  level: number
  streak_days: number
  is_admin: boolean
}

interface HeaderProps {
  profile: Profile | null
  onMenuClick: () => void
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-text-secondary-light dark:text-text-secondary-dark cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200">
              {getGreeting()}, {profile?.name ? profile.name.split(' ')[0] : 'Student'}
            </h1>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak */}
          {profile && profile.streak_days > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
              <Flame className="w-4 h-4 animate-flame text-orange-500" />
              <span className="text-sm font-bold">{profile.streak_days}</span>
            </div>
          )}

          {/* XP Badge */}
          {profile && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              <span className="text-sm font-bold">{profile.xp} XP</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-text-secondary-light dark:text-text-secondary-dark transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Avatar */}
          {profile && (
            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
              {profile.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
