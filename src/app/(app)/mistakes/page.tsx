'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { AlertCircle, Plus, Edit2, CheckCircle, Filter, Calendar } from 'lucide-react'

interface Mistake {
  id: string
  mistake: string
  reason: string
  correction: string
  is_corrected: boolean
  created_at: string
  subjects: { name: string } | null
  topics: { name: string } | null
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMistake, setEditMistake] = useState<Mistake | null>(null)
  const [filterSubject, setFilterSubject] = useState('')
  const [form, setForm] = useState({ subject_id: '', mistake: '', reason: '', correction: '' })
  const [saving, setSaving] = useState(false)
  const [plannerModalOpen, setPlannerModalOpen] = useState(false)
  const [mistakeToPlan, setMistakeToPlan] = useState<Mistake | null>(null)
  const [reviewDate, setReviewDate] = useState('')
  const { success, error: showError } = useToast()

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [mistakesRes, subjectsRes] = await Promise.all([
      supabase.from('mistakes').select('*, subjects(name), topics(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name').eq('user_id', user.id),
    ])

    setMistakes((mistakesRes.data || []) as unknown as Mistake[])
    const uniqueSubs = (subjectsRes.data || []).filter((s, index, self) => 
      index === self.findIndex((t) => t.name === s.name)
    );
    setSubjects(uniqueSubs)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!form.subject_id || !form.mistake) { showError('Subject and mistake are required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editMistake) {
      await supabase.from('mistakes').update({ ...form }).eq('id', editMistake.id)
      success('Mistake updated!')
    } else {
      await supabase.from('mistakes').insert({ ...form, user_id: user.id })
      success('Mistake logged!')
    }
    setModalOpen(false); setEditMistake(null); setForm({ subject_id: '', mistake: '', reason: '', correction: '' }); setSaving(false)
    fetchData()
  }

  const toggleCorrected = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('mistakes').update({ is_corrected: !current }).eq('id', id)
    fetchData()
    success(!current ? 'Marked as corrected ✅' : 'Marked as uncorrected')
  }

  const handleAddToPlanner = async () => {
    if (!reviewDate || !mistakeToPlan) { showError('Please select a date'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('mistakes').update({ review_date: reviewDate }).eq('id', mistakeToPlan.id)
    if (error) { showError(error.message); setSaving(false); return }
    success('Added to planner for ' + reviewDate + ' 📅')
    setPlannerModalOpen(false)
    setMistakeToPlan(null)
    setReviewDate('')
    setSaving(false)
    fetchData()
  }

  const filtered = filterSubject
    ? mistakes.filter(m => m.subjects?.name === filterSubject)
    : mistakes

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-danger-500" />
            Mistake Log
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Track mistakes, understand reasons, and review corrections
          </p>
        </div>
        <Button onClick={() => { setEditMistake(null); setForm({ subject_id: '', mistake: '', reason: '', correction: '' }); setModalOpen(true) }} icon={<Plus className="w-4 h-4" />}>
          Log Mistake
        </Button>
      </div>

      {/* Filter */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
          <button onClick={() => setFilterSubject('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${!filterSubject ? 'bg-primary-500 text-white' : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark'}`}>
            All
          </button>
          {Array.from(new Set(subjects.map(s => s.name))).map(name => (
            <button key={name} onClick={() => setFilterSubject(name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterSubject === name ? 'bg-primary-500 text-white' : 'bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-secondary-light dark:text-text-secondary-dark'}`}>
              {name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-8 h-8" />}
          title="No mistakes logged"
          description="Log your mistakes to track patterns and improve."
          action={<Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>Log Mistake</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <Card key={m.id} className={m.is_corrected ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={m.is_corrected ? 'secondary' : 'danger'} size="sm" dot>
                      {m.is_corrected ? 'Corrected' : 'Pending'}
                    </Badge>
                    {m.subjects && <Badge variant="neutral" size="sm">{m.subjects.name}</Badge>}
                  </div>
                  <p className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                    {m.mistake}
                  </p>
                  {m.reason && (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      <strong>Reason:</strong> {m.reason}
                    </p>
                  )}
                  {m.correction && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      <strong>Correction:</strong> {m.correction}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setMistakeToPlan(m); setReviewDate(new Date().toISOString().split('T')[0]); setPlannerModalOpen(true) }}
                    className="p-2 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/10 cursor-pointer" title="Add to Planner">
                    <Calendar className="w-4 h-4 text-accent-500" />
                  </button>
                  <button onClick={() => toggleCorrected(m.id, m.is_corrected)}
                    className="p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-900/10 cursor-pointer">
                    <CheckCircle className={`w-4 h-4 ${m.is_corrected ? 'text-secondary-500' : 'text-border-light dark:text-border-dark'}`} />
                  </button>
                  <button onClick={() => { setEditMistake(m); setForm({ subject_id: '', mistake: m.mistake, reason: m.reason, correction: m.correction }); setModalOpen(true) }}
                    className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer">
                    <Edit2 className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMistake ? 'Edit Mistake' : 'Log Mistake'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Subject</label>
            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Mistake" placeholder="What went wrong?" value={form.mistake} onChange={(e) => setForm({ ...form, mistake: e.target.value })} />
          <Input label="Reason" placeholder="Why did it happen?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Input label="Correction" placeholder="How to fix it?" value={form.correction} onChange={(e) => setForm({ ...form, correction: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>{editMistake ? 'Save' : 'Log Mistake'}</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={plannerModalOpen} onClose={() => setPlannerModalOpen(false)} title="Schedule Mistake Review">
        <div className="space-y-4">
          <Input type="date" label="Review Date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setPlannerModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddToPlanner} isLoading={saving}>Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
