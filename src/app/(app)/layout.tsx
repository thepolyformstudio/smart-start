'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'
import { CelebrationOverlay } from '@/components/ui/celebration-overlay'
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, xp, level, streak_days, is_admin')
          .eq('id', user.id)
          .single()
        
        console.log('Profile fetch attempt:', { user: user.id, data, error })
        
        if (data) setProfile(data)
      } else {
        console.log('No user found in AppLayout')
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Sidebar - Desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} profile={profile} />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
      <CelebrationOverlay />
    </div>
  )
}
