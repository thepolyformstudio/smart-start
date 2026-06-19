'use client'

import React, { useEffect, useState, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit2, Trash2, ChevronRight, ArrowLeft, FolderOpen } from 'lucide-react'
import Link from 'next/link'

interface Chapter {
  id: string
  name: string
  order_index: number
  topics: { id: string; status: string; confidence: number }[]
}

interface SubjectDetail {
  id: string
  name: string
  color: string
}

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [subject, setSubject] = useState<SubjectDetail | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [subjectRes, chaptersRes] = await Promise.all([
      supabase.from('subjects').select('id, name, color').eq('id', id).single(),
      supabase.from('chapters').select('id, name, order_index, topics(id, status, confidence)').eq('subject_id', id).order('order_index'),
    ])
    setSubject(subjectRes.data)
    setChapters(chaptersRes.data || [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!name.trim()) { showError('Chapter name is required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editChapter) {
      await supabase.from('chapters').update({ name }).eq('id', editChapter.id)
      success('Chapter updated!')
    } else {
      await supabase.from('chapters').insert({
        name, subject_id: id, user_id: user.id, order_index: chapters.length,
      })
      success('Chapter added!')
    }
    setModalOpen(false); setEditChapter(null); setName(''); setSaving(false)
    fetchData()
  }

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Delete this chapter and all its topics?')) return
    const supabase = createClient()
    await supabase.from('chapters').delete().eq('id', chapterId)
    success('Chapter deleted')
    fetchData()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/subjects">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: subject?.color || '#6C5CE7' }}
          >
            {subject?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
              {subject?.name}
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {chapters.length} chapters
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditChapter(null); setName(''); setModalOpen(true) }} icon={<Plus className="w-4 h-4" />}>
          Add Chapter / Topic
        </Button>
      </div>

      {chapters.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8" />}
          title="No chapters yet"
          description="Add chapters to organize your study topics."
          action={<Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>Add Chapter / Topic</Button>}
        />
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => {
            const total = chapter.topics?.length || 0
            const completed = chapter.topics?.filter(t => t.status === 'completed').length || 0
            return (
              <Card key={chapter.id} className="group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">{chapter.name}</h3>
                      <Badge variant="neutral" size="sm">{total} topics</Badge>
                    </div>
                    <ProgressBar value={completed} max={total || 1} size="sm" showLabel={false} />
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                      {completed}/{total} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditChapter(chapter); setName(chapter.name); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Edit2 className="w-4 h-4 text-text-muted-light" />
                    </button>
                    <button onClick={() => handleDelete(chapter.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </button>
                    <Link href={`/subjects/${id}/chapters/${chapter.id}`}>
                      <ChevronRight className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editChapter ? 'Edit Chapter' : 'Add Chapter / Topic'}>
        <div className="space-y-4">
          <Input label="Chapter / Topic Name" placeholder="e.g. Mechanics, Thermodynamics" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>{editChapter ? 'Save' : 'Add Chapter / Topic'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
