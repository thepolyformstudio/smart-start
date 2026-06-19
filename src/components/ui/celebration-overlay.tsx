'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, Star, Sparkles } from 'lucide-react'

export function CelebrationOverlay() {
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [achievements, setAchievements] = useState<string[]>([])

  useEffect(() => {
    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent
      setLevelUp(customEvent.detail.level)
      setTimeout(() => setLevelUp(null), 4000)
    }

    const handleAchievement = (e: Event) => {
      const customEvent = e as CustomEvent
      setAchievements(customEvent.detail.achievements)
      setTimeout(() => setAchievements([]), 5000)
    }

    window.addEventListener('smartstart:levelup', handleLevelUp)
    window.addEventListener('smartstart:achievement', handleAchievement)

    return () => {
      window.removeEventListener('smartstart:levelup', handleLevelUp)
      window.removeEventListener('smartstart:achievement', handleAchievement)
    }
  }, [])

  if (!levelUp && achievements.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" 
           onClick={() => { setLevelUp(null); setAchievements([]) }}></div>
      
      {levelUp && (
        <div className="relative z-10 text-center animate-bounce-in bg-gradient-to-b from-surface-light to-surface-elevated-light dark:from-surface-dark dark:to-surface-elevated-dark p-10 rounded-3xl border border-primary-500/30 shadow-2xl shadow-primary-500/50 min-w-[300px]">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/50 animate-pulse-glow">
              <Star className="w-12 h-12 text-white animate-spin-slow" />
            </div>
          </div>
          <h2 className="mt-8 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
            LEVEL UP!
          </h2>
          <p className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-4">
            You are now Level {levelUp}
          </p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Amazing work! Keep pushing forward!
          </p>
        </div>
      )}

      {achievements.length > 0 && !levelUp && (
        <div className="relative z-10 text-center animate-bounce-in bg-gradient-to-b from-surface-light to-surface-elevated-light dark:from-surface-dark dark:to-surface-elevated-dark p-10 rounded-3xl border border-accent-500/30 shadow-2xl shadow-accent-500/50 min-w-[300px]">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-accent-500/50 animate-pulse-glow">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-8 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-danger-500">
            ACHIEVEMENT UNLOCKED!
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface-elevated-light dark:bg-surface-elevated-dark px-4 py-2 rounded-xl border border-border-light dark:border-border-dark">
                <Sparkles className="w-5 h-5 text-accent-500" />
                <span className="font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wide">
                  {a.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
