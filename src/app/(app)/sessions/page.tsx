'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Session {
  id: string; duration_minutes: number; session_type: string; status: string; notes: string | null
  started_at: string; subjects: { name: string } | null
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('study_sessions')
      .select('*, subjects(name)').eq('user_id', user.id).order('started_at', { ascending: false }).limit(50)
    setSessions((data || []) as unknown as Session[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  if (loading) return <PageLoader />

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-500" /> Session History
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {sessions.length} sessions · {Math.round(totalMinutes / 60 * 10) / 10} hours total
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={<Clock className="w-8 h-8" />} title="No sessions yet" description="Start a study session using the timer to see your history here." />
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <Card key={s.id} padding="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {s.subjects?.name || 'Study Session'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {format(new Date(s.started_at), 'MMM d, h:mm a')}
                      </span>
                      <Badge variant="neutral" size="sm">{s.session_type}</Badge>
                      <Badge variant={s.status === 'completed' ? 'secondary' : s.status === 'partial' ? 'accent' : 'danger'} size="sm">
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary-500">{s.duration_minutes}m</span>
              </div>
              {s.notes && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 pl-13 ml-13">
                  📝 {s.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
