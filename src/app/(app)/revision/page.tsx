'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { Brain, CheckCircle, SkipForward, Calendar } from 'lucide-react'
import { format, isToday, isPast, isFuture } from 'date-fns'
import { awardXP, updateStreak, checkAchievements } from '@/lib/gamification'

interface RevisionItem {
  id: string
  revision_date: string
  revision_number: number
  status: string
  topic_id: string
  topics: { name: string; chapters: { name: string; subjects: { name: string } } }
}

export default function RevisionPage() {
  const [revisions, setRevisions] = useState<RevisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('today')
  const { success } = useToast()

  const fetchRevisions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('revision_schedule')
      .select('*, topics(name, chapters(name, subjects(name)))')
      .eq('user_id', user.id)
      .order('revision_date')

    setRevisions((data || []) as unknown as RevisionItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRevisions() }, [fetchRevisions])

  const updateStatus = async (id: string, status: 'completed' | 'skipped') => {
    const supabase = createClient()
    await supabase.from('revision_schedule').update({ status }).eq('id', id)

    if (status === 'completed') {
      const { leveledUp } = await awardXP(10)
      await updateStreak()
      const newAchievements = await checkAchievements()

      let message = 'Revision completed! +10 XP 🎉'
      if (leveledUp) message += ' 🎊 Level up!'
      if (newAchievements.length > 0) message += ' 🏆 Achievement unlocked!'
      success(message)
    } else {
      success('Revision skipped')
    }
    fetchRevisions()
  }

  const filtered = revisions.filter(r => {
    const date = new Date(r.revision_date)
    if (filter === 'today') return isToday(date) && r.status === 'pending'
    if (filter === 'upcoming') return isFuture(date) && r.status === 'pending'
    if (filter === 'overdue') return isPast(date) && !isToday(date) && r.status === 'pending'
    return true
  })

  const todayCount = revisions.filter(r => isToday(new Date(r.revision_date)) && r.status === 'pending').length
  const overdueCount = revisions.filter(r => isPast(new Date(r.revision_date)) && !isToday(new Date(r.revision_date)) && r.status === 'pending').length

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary-500" />
          Revision Schedule
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Spaced repetition: Day 1, 3, 7, 14, 30
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center" padding="sm">
          <p className="text-xl font-extrabold text-primary-500">{todayCount}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Due Today</p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-xl font-extrabold text-danger-500">{overdueCount}</p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Overdue</p>
        </Card>
        <Card className="text-center" padding="sm">
          <p className="text-xl font-extrabold text-secondary-500">
            {revisions.filter(r => r.status === 'completed').length}
          </p>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Completed</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['today', 'upcoming', 'overdue', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer capitalize ${filter === f ? 'bg-primary-500 text-white' : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title={filter === 'today' ? 'No revisions due today' : 'No revisions found'}
          description="Revision schedules are auto-created when you complete a topic."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(rev => (
            <Card key={rev.id} padding="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {rev.topics?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" size="sm">{rev.topics?.chapters?.subjects?.name}</Badge>
                    <Badge variant="primary" size="sm">Rev #{rev.revision_number}</Badge>
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      {format(new Date(rev.revision_date), 'MMM d')}
                    </span>
                  </div>
                </div>
                {rev.status === 'pending' ? (
                  <div className="flex gap-1">
                    <button onClick={() => updateStatus(rev.id, 'completed')}
                      className="p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-900/10 transition-colors cursor-pointer">
                      <CheckCircle className="w-5 h-5 text-secondary-500" />
                    </button>
                    <button onClick={() => updateStatus(rev.id, 'skipped')}
                      className="p-2 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/10 transition-colors cursor-pointer">
                      <SkipForward className="w-5 h-5 text-accent-500" />
                    </button>
                  </div>
                ) : (
                  <Badge variant={rev.status === 'completed' ? 'secondary' : 'accent'}>
                    {rev.status}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
