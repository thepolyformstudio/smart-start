'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import {
  BookOpen, Plus, Edit2, Trash2, ChevronRight, Search
} from 'lucide-react'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
  color: string
  icon: string
  chapters: { id: string; topics: { id: string; status: string }[] }[]
}

const subjectColors = [
  '#6C5CE7', '#00B894', '#E17055', '#FDCB6E', '#0984E3',
  '#E84393', '#00CEC9', '#8E44AD', '#2D3436', '#FD79A8',
]

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(subjectColors[0])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const { success, error: showError } = useToast()

  const fetchSubjects = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('subjects')
      .select('id, name, color, icon, chapters(id, topics(id, status))')
      .eq('user_id', user.id)
      .order('order_index')

    // Deduplicate subjects by name to prevent duplicate DB records from showing
    const uniqueSubjects: Subject[] = []
    const seenNames = new Set<string>()
    
    ;(data || []).forEach((subject: any) => {
      const nameLower = subject.name.toLowerCase()
      if (!seenNames.has(nameLower)) {
        seenNames.add(nameLower)
        uniqueSubjects.push(subject)
      }
    })

    setSubjects(uniqueSubjects)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSubjects() }, [fetchSubjects])

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) { showError('Subject name is required'); return }

    const isDuplicate = subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== editSubject?.id)
    if (isDuplicate) { showError('A subject with this name already exists'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({ name, color })
        .eq('id', editSubject.id)
      if (error) { showError(error.message); setSaving(false); return }
      success('Subject updated!')
    } else {
      const { error } = await supabase
        .from('subjects')
        .insert({ name, color, user_id: user.id, order_index: subjects.length })
      if (error) { showError(error.message); setSaving(false); return }
      success('Subject added!')
    }

    setModalOpen(false)
    setEditSubject(null)
    setName('')
    setColor(subjectColors[0])
    setSaving(false)
    fetchSubjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject and all its chapters/topics?')) return
    const supabase = createClient()
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) { showError(error.message); return }
    success('Subject deleted')
    fetchSubjects()
  }

  const openEdit = (subject: Subject) => {
    setEditSubject(subject)
    setName(subject.name)
    setColor(subject.color)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditSubject(null)
    setName('')
    setColor(subjectColors[Math.floor(Math.random() * subjectColors.length)])
    setModalOpen(true)
  }

  if (loading) return <PageLoader />

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            Subjects
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Manage your subjects, chapters, and topics
          </p>
        </div>
        <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>
          Add Subject
        </Button>
      </div>

      {subjects.length > 3 && (
        <Input
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      )}

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No subjects yet"
          description="Add your first subject to start organizing your study material."
          action={<Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add Subject</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((subject) => {
            const totalTopics = subject.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0
            const completedTopics = subject.chapters?.reduce((sum, ch) =>
              sum + (ch.topics?.filter(t => t.status === 'completed').length || 0), 0) || 0
            const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

            return (
              <Card key={subject.id} className="group relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {subject.chapters?.length || 0} chapters · {totalTopics} topics
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(subject)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer">
                      <Edit2 className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                    </button>
                    <button onClick={() => handleDelete(subject.id)} className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 cursor-pointer">
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </button>
                  </div>
                </div>

                <ProgressBar
                  value={completedTopics}
                  max={totalTopics || 1}
                  label={`${completedTopics}/${totalTopics} completed`}
                  size="sm"
                />

                {progress === 100 && totalTopics > 0 && (
                  <Badge variant="secondary" className="mt-3">✓ Completed</Badge>
                )}

                <Link href={`/subjects/${subject.id}`}>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-light dark:border-border-dark text-sm text-primary-500 font-medium hover:text-primary-600 transition-colors">
                    View Chapters
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editSubject ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Physics, Mathematics"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {subjectColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
