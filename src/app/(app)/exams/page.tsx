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
import { Target, Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

interface Exam {
  id: string; name: string; exam_date: string; previous_score: string; target_score: string
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editExam, setEditExam] = useState<Exam | null>(null)
  const [form, setForm] = useState({ name: '', exam_date: '', previous_score: '', target_score: '' })
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()

  const fetchExams = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('exams').select('*').eq('user_id', user.id).order('exam_date')
    setExams(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchExams() }, [fetchExams])

  const handleSave = async () => {
    if (!form.name || !form.exam_date) { showError('Name and date are required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editExam) {
      await supabase.from('exams').update(form).eq('id', editExam.id)
      success('Exam updated!')
    } else {
      await supabase.from('exams').insert({ ...form, user_id: user.id })
      success('Exam added!')
    }
    setModalOpen(false); setEditExam(null); setForm({ name: '', exam_date: '', previous_score: '', target_score: '' }); setSaving(false)
    fetchExams()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return
    const supabase = createClient()
    await supabase.from('exams').delete().eq('id', id)
    success('Exam deleted'); fetchExams()
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
            <Target className="w-6 h-6 text-danger-500" /> Exams
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Track your upcoming exams and goals</p>
        </div>
        <Button onClick={() => { setEditExam(null); setForm({ name: '', exam_date: '', previous_score: '', target_score: '' }); setModalOpen(true) }} icon={<Plus className="w-4 h-4" />}>Add Exam</Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState icon={<Target className="w-8 h-8" />} title="No exams added" description="Add your upcoming exams to track countdown and goals."
          action={<Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>Add Exam</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map(exam => {
            const daysLeft = differenceInDays(new Date(exam.exam_date), new Date())
            const isPast = daysLeft < 0
            return (
              <Card key={exam.id} className={`group ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark text-lg">{exam.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditExam(exam); setForm(exam); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer">
                      <Edit2 className="w-4 h-4 text-text-muted-light" />
                    </button>
                    <button onClick={() => handleDelete(exam.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 cursor-pointer">
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {format(new Date(exam.exam_date), 'MMM d, yyyy')}
                  </span>
                  <Badge variant={isPast ? 'neutral' : daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'accent' : 'primary'}>
                    {isPast ? 'Past' : `${daysLeft} days left`}
                  </Badge>
                </div>
                {(exam.previous_score || exam.target_score) && (
                  <div className="flex items-center gap-4 text-sm">
                    {exam.previous_score && <div><span className="text-text-muted-light dark:text-text-muted-dark">Previous:</span> <strong className="text-text-primary-light dark:text-text-primary-dark">{exam.previous_score}</strong></div>}
                    {exam.target_score && <div><span className="text-text-muted-light dark:text-text-muted-dark">Target:</span> <strong className="text-secondary-500">{exam.target_score}</strong></div>}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editExam ? 'Edit Exam' : 'Add Exam'}>
        <div className="space-y-4">
          <Input label="Exam Name" placeholder="e.g. JEE Main" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Exam Date" type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Previous Score" placeholder="e.g. 82 percentile" value={form.previous_score} onChange={(e) => setForm({ ...form, previous_score: e.target.value })} />
            <Input label="Target Score" placeholder="e.g. 95 percentile" value={form.target_score} onChange={(e) => setForm({ ...form, target_score: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>{editExam ? 'Save' : 'Add Exam'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
