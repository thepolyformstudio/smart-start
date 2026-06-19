'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import { PageLoader } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { Award, Star, Flame, Share2, LogOut, Trophy, Zap, BookOpen, CheckCircle, Target } from 'lucide-react'

const ACHIEVEMENTS = [
  { type: 'streak_7', icon: '🔥', title: '7-Day Streak', desc: 'Study for 7 consecutive days' },
  { type: 'streak_30', icon: '🌟', title: '30-Day Streak', desc: 'Study for 30 consecutive days' },
  { type: 'topics_10', icon: '📚', title: 'Getting Started', desc: 'Complete 10 topics' },
  { type: 'topics_100', icon: '🎓', title: 'Topic Master', desc: 'Complete 100 topics' },
  { type: 'sessions_50', icon: '⏰', title: 'Dedicated Learner', desc: 'Complete 50 study sessions' },
  { type: 'revision_master', icon: '🧠', title: 'Revision Master', desc: 'Complete 50 revisions' },
  { type: 'questions_500', icon: '💡', title: 'Problem Solver', desc: 'Solve 500 questions' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string; age: number | null; class_year: string | null; xp: number; level: number; streak_days: number
  } | null>(null)
  const [achievements, setAchievements] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', class_year: '' })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ subjects: 0, topics: 0, sessions: 0 })
  const { success, error: errorToast } = useToast()
  const router = useRouter()

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, achievementsRes, subjectsRes, topicsRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('achievements').select('achievement_type').eq('user_id', user.id),
      supabase.from('subjects').select('id').eq('user_id', user.id),
      supabase.from('topics').select('id').eq('user_id', user.id),
      supabase.from('study_sessions').select('id').eq('user_id', user.id),
    ])

    setProfile(profileRes.data)
    if (profileRes.data) {
      setEditForm({ name: profileRes.data.name || '', class_year: profileRes.data.class_year || '' })
    }
    setAchievements((achievementsRes.data || []).map(a => a.achievement_type))
    setStats({ subjects: subjectsRes.data?.length || 0, topics: topicsRes.data?.length || 0, sessions: sessionsRes.data?.length || 0 })
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: editForm.name, class_year: editForm.class_year })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      errorToast(updateError.message || 'Failed to update profile')
      return
    }

    success('Profile updated successfully!')
    setProfile(prev => prev ? { ...prev, ...editForm } : null)
    setIsEditing(false)
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Smart Start',
      text: 'I am using Smart Start to plan my studies, track progress, and build better study habits. Try it here:',
      url: window.location.origin,
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        if (user) await supabase.from('share_activity').insert({ user_id: user.id, share_method: 'web_share' })
        success('Shared successfully!')
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        if (user) await supabase.from('share_activity').insert({ user_id: user.id, share_method: 'copy_link' })
        success('Link copied to clipboard!')
      }
    } catch { /* User cancelled share */ }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const levelXP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]
  const getLevelTitle = (level: number) => {
    const titles = ['Beginner', 'Learner', 'Student', 'Achiever', 'Scholar', 'Expert', 'Master', 'Guru', 'Legend', 'Champion']
    return titles[Math.min(level - 1, titles.length - 1)]
  }

  if (loading) return <PageLoader />

  const currentLevelXP = levelXP[(profile?.level || 1) - 1] || 0
  const nextLevelXP = levelXP[profile?.level || 1] || currentLevelXP + 1000

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card variant="gradient" padding="lg" hover={false}>
        <div className="text-center text-white relative">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="absolute top-0 right-0 text-white/70 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}

          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>

          {isEditing ? (
            <div className="max-w-xs mx-auto space-y-3 mb-6">
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Name"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <input
                type="text"
                value={editForm.class_year}
                onChange={e => setEditForm(prev => ({ ...prev, class_year: e.target.value }))}
                placeholder="Class/Year (e.g., Grade 10)"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button variant="accent" size="sm" onClick={handleSaveProfile} className="text-accent-900">
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">{profile?.name || 'Student'}</h1>
              {profile?.class_year && <p className="text-white/70 text-sm">{profile.class_year}</p>}
            </>
          )}

          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold">{profile?.level || 1}</p>
              <p className="text-xs text-white/60">Level</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{profile?.xp || 0}</p>
              <p className="text-xs text-white/60">XP</p>
            </div>
            <div className="text-center flex items-center gap-1">
              <p className="text-xl font-bold">{profile?.streak_days || 0}</p>
              <Flame className="w-4 h-4 animate-flame text-orange-300" />
              <p className="text-xs text-white/60">Streak</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Level Progress */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
              {getLevelTitle(profile?.level || 1)} · Level {profile?.level || 1}
            </p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
              {nextLevelXP - (profile?.xp || 0)} XP to next level
            </p>
          </div>
        </div>
        <ProgressBar value={(profile?.xp || 0) - currentLevelXP} max={nextLevelXP - currentLevelXP} color="accent" showLabel />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center" padding="sm">
          <BookOpen className="w-5 h-5 text-primary-500 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.subjects}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Subjects</p>
        </Card>
        <Card className="text-center" padding="sm">
          <CheckCircle className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.topics}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Topics</p>
        </Card>
        <Card className="text-center" padding="sm">
          <Target className="w-5 h-5 text-danger-500 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.sessions}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Sessions</p>
        </Card>
      </div>

      {/* Achievements Showcase */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent-500" />
              Achievement Showcase
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Unlock badges as you progress
            </p>
          </div>
          <div className="bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 font-bold px-3 py-1.5 rounded-lg border border-accent-200 dark:border-accent-800">
            {achievements.length} / {ACHIEVEMENTS.length}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(a => {
            const unlocked = achievements.includes(a.type)
            return (
              <div 
                key={a.type} 
                className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                  unlocked 
                    ? 'bg-gradient-to-br from-surface-light to-surface-elevated-light dark:from-surface-dark dark:to-surface-elevated-dark border-accent-200 dark:border-accent-900/50 hover:shadow-xl hover:shadow-accent-500/10 hover:-translate-y-1 z-10' 
                    : 'bg-surface-elevated-light/50 dark:bg-surface-elevated-dark/50 border-border-light dark:border-border-dark opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
              >
                {unlocked && (
                  <div className="absolute inset-0 bg-white/5 shimmer rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                )}
                
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner ${
                  unlocked ? 'bg-accent-100 dark:bg-accent-900/30 shadow-accent-500/20 animate-pulse-glow' : 'bg-bg-light dark:bg-bg-dark'
                }`}>
                  <span className={unlocked ? 'group-hover:scale-110 transition-transform' : ''}>{a.icon}</span>
                </div>
                
                <h4 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark text-center leading-tight">
                  {a.title}
                </h4>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark text-center mt-1.5 leading-relaxed">
                  {a.desc}
                </p>
                
                {unlocked && (
                  <div className="absolute -top-2 -right-2 bg-accent-500 text-white rounded-full p-1.5 shadow-lg shadow-accent-500/40 animate-scale-in">
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Share */}
      <Card>
        <div className="text-center">
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Share Smart Start 🚀
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
            Help your friends study smarter
          </p>
          <Button onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
            Share App
          </Button>
        </div>
      </Card>

      {/* Logout */}
      <Button variant="danger" className="w-full" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
        Sign Out
      </Button>
    </div>
  )
}
