'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { PageLoader } from '@/components/ui/loading'
import { MessageSquare, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ReflectionPage() {
  const [form, setForm] = useState({ completed_summary: '', questions_solved: 0, difficulty_notes: '', tomorrow_priority: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<{ reflection_date: string; completed_summary: string; questions_solved: number }[]>([])
  const { success } = useToast()

  const today = format(new Date(), 'yyyy-MM-dd')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: todayReflection } = await supabase.from('daily_reflections')
      .select('*').eq('user_id', user.id).eq('reflection_date', today).single()

    if (todayReflection) {
      setForm({
        completed_summary: todayReflection.completed_summary || '',
        questions_solved: todayReflection.questions_solved || 0,
        difficulty_notes: todayReflection.difficulty_notes || '',
        tomorrow_priority: todayReflection.tomorrow_priority || '',
      })
      setSaved(true)
    }

    const { data: hist } = await supabase.from('daily_reflections')
      .select('reflection_date, completed_summary, questions_solved')
      .eq('user_id', user.id).order('reflection_date', { ascending: false }).limit(7)

    setHistory(hist || [])
    setLoading(false)
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('daily_reflections').upsert({
      user_id: user.id, reflection_date: today, ...form,
    }, { onConflict: 'user_id,reflection_date' })

    setSaved(true); setSaving(false)
    success('Reflection saved! 📝')
    fetchData()
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          Daily Reflection
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <Card variant="glass" padding="lg">
        {saved && (
          <div className="flex items-center gap-2 mb-4 text-secondary-500">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Today&apos;s reflection saved</span>
          </div>
        )}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              What did you complete today? 📋
            </label>
            <textarea value={form.completed_summary} onChange={(e) => setForm({ ...form, completed_summary: e.target.value })}
              rows={3} placeholder="List what you accomplished..." className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              How many questions did you solve? 📊
            </label>
            <input type="number" min="0" value={form.questions_solved}
              onChange={(e) => setForm({ ...form, questions_solved: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              What was difficult? 🤔
            </label>
            <textarea value={form.difficulty_notes} onChange={(e) => setForm({ ...form, difficulty_notes: e.target.value })}
              rows={2} placeholder="Describe any challenges..." className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Tomorrow&apos;s priority? 🎯
            </label>
            <textarea value={form.tomorrow_priority} onChange={(e) => setForm({ ...form, tomorrow_priority: e.target.value })}
              rows={2} placeholder="What will you focus on tomorrow?" className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm resize-none" />
          </div>

          <Button onClick={handleSave} isLoading={saving} className="w-full">
            {saved ? 'Update Reflection' : 'Save Reflection'}
          </Button>
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4">Recent Reflections</h3>
          <div className="space-y-3">
            {history.filter(h => h.reflection_date !== today).map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                  {format(new Date(h.reflection_date), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-text-primary-light dark:text-text-primary-dark">{h.completed_summary || 'No summary'}</p>
                {h.questions_solved > 0 && <p className="text-xs text-primary-500 mt-1">{h.questions_solved} questions solved</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
