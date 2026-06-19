'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loading'
import { BarChart3, Clock, CheckCircle, Flame, TrendingUp, BookOpen, Brain, Target } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudyHours: 0, totalSessions: 0, totalTopics: 0, completedTopics: 0,
    streak: 0, weeklyHours: [] as { day: string; hours: number }[],
    subjectProgress: [] as { name: string; total: number; completed: number; color: string }[],
    revisionStats: { total: 0, completed: 0, skipped: 0 },
  })

  const fetchAnalytics = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)

    // Fetch all data in parallel
    const [sessionsRes, topicsRes, subjectsRes, profileRes, revisionRes] = await Promise.all([
      supabase.from('study_sessions').select('duration_minutes, started_at').eq('user_id', user.id),
      supabase.from('topics').select('id, status').eq('user_id', user.id),
      supabase.from('subjects').select('id, name, color, chapters(topics(id, status))').eq('user_id', user.id),
      supabase.from('profiles').select('streak_days').eq('id', user.id).single(),
      supabase.from('revision_schedule').select('status').eq('user_id', user.id),
    ])

    const sessions = sessionsRes.data || []
    const topics = topicsRes.data || []
    const subjects = (subjectsRes.data || []) as { id: string; name: string; color: string; chapters: { topics: { id: string; status: string }[] }[] }[]

    // Total study hours
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)

    // Weekly hours
    const weeklyHours: { day: string; hours: number }[] = []
    for (let i = 0; i < 7; i++) {
      const day = subDays(today, 6 - i)
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayMinutes = sessions
        .filter(s => s.started_at && format(new Date(s.started_at), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, s) => sum + s.duration_minutes, 0)
      weeklyHours.push({ day: format(day, 'EEE'), hours: Math.round(dayMinutes / 60 * 10) / 10 })
    }

    // Subject progress
    const subjectProgress = subjects.map(s => {
      const allTopics = s.chapters?.flatMap(c => c.topics || []) || []
      return {
        name: s.name,
        total: allTopics.length,
        completed: allTopics.filter(t => t.status === 'completed').length,
        color: s.color,
      }
    })

    // Revision stats
    const revisions = revisionRes.data || []

    setStats({
      totalStudyHours: Math.round(totalMinutes / 60 * 10) / 10,
      totalSessions: sessions.length,
      totalTopics: topics.length,
      completedTopics: topics.filter(t => t.status === 'completed').length,
      streak: profileRes.data?.streak_days || 0,
      weeklyHours,
      subjectProgress,
      revisionStats: {
        total: revisions.length,
        completed: revisions.filter(r => r.status === 'completed').length,
        skipped: revisions.filter(r => r.status === 'skipped').length,
      },
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  if (loading) return <PageLoader />

  const maxWeeklyHours = Math.max(...stats.weeklyHours.map(d => d.hours), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-500" />
          Analytics
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Track your study progress and performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center">
          <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.totalStudyHours}h</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Total Study Hours</p>
        </Card>
        <Card className="text-center">
          <CheckCircle className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.totalSessions}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Total Sessions</p>
        </Card>
        <Card className="text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2 animate-flame" />
          <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{stats.streak}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Day Streak</p>
        </Card>
        <Card className="text-center">
          <Target className="w-6 h-6 text-danger-500 mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            {stats.totalTopics > 0 ? Math.round((stats.completedTopics / stats.totalTopics) * 100) : 0}%
          </p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Completion Rate</p>
        </Card>
      </div>

      {/* Weekly Study Hours Chart */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          Weekly Study Hours
        </h3>
        <div className="flex items-end gap-2 h-40">
          {stats.weeklyHours.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark">{d.hours}h</span>
              <div className="w-full rounded-t-lg bg-primary-500 transition-all duration-500"
                style={{ height: `${(d.hours / maxWeeklyHours) * 120}px`, minHeight: d.hours > 0 ? '4px' : '0' }} />
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-secondary-500" />
            Subject Progress
          </h3>
          <div className="space-y-4">
            {stats.subjectProgress.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{s.name}</span>
                  <span className="text-sm text-text-muted-light dark:text-text-muted-dark">{s.completed}/{s.total}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.total > 0 ? (s.completed / s.total) * 100 : 0}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
            {stats.subjectProgress.length === 0 && (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center py-4">No subjects added yet</p>
            )}
          </div>
        </Card>

        {/* Revision Stats */}
        <Card>
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-500" />
            Revision Stats
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
              <p className="text-2xl font-extrabold text-primary-500">{stats.revisionStats.total}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Total</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
              <p className="text-2xl font-extrabold text-secondary-500">{stats.revisionStats.completed}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
              <p className="text-2xl font-extrabold text-accent-500">{stats.revisionStats.skipped}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Skipped</p>
            </div>
          </div>
          {stats.revisionStats.total > 0 && (
            <div className="mt-4 w-full h-3 rounded-full bg-border-light dark:bg-border-dark overflow-hidden flex">
              <div className="h-full bg-secondary-500" style={{ width: `${(stats.revisionStats.completed / stats.revisionStats.total) * 100}%` }} />
              <div className="h-full bg-accent-500" style={{ width: `${(stats.revisionStats.skipped / stats.revisionStats.total) * 100}%` }} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
