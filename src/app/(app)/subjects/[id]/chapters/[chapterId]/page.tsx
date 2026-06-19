'use client'

import React, { useEffect, useState, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit2, Trash2, ArrowLeft, Star, FileText } from 'lucide-react'
import Link from 'next/link'

interface Topic {
  id: string
  name: string
  status: string
  confidence: number
  completed_at: string | null
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started', color: 'neutral' },
  { value: 'learning', label: 'Learning', color: 'accent' },
  { value: 'completed', label: 'Completed', color: 'secondary' },
  { value: 'needs_revision', label: 'Needs Revision', color: 'danger' },
] as const

export default function ChapterDetailPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id: subjectId, chapterId } = use(params)
  const [chapter, setChapter] = useState<{ name: string } | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTopic, setEditTopic] = useState<Topic | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('not_started')
  const [confidence, setConfidence] = useState(1)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [chapterRes, topicsRes] = await Promise.all([
      supabase.from('chapters').select('name').eq('id', chapterId).single(),
      supabase.from('topics').select('*').eq('chapter_id', chapterId).order('order_index'),
    ])
    setChapter(chapterRes.data)
    setTopics(topicsRes.data || [])
    setLoading(false)
  }, [chapterId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!name.trim()) { showError('Topic name is required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editTopic) {
      await supabase.from('topics').update({ name, status, confidence }).eq('id', editTopic.id)
      success('Topic updated!')
    } else {
      await supabase.from('topics').insert({
        name, status, confidence, chapter_id: chapterId, user_id: user.id, order_index: topics.length,
      })
      success('Topic added!')
    }
    setModalOpen(false); setEditTopic(null); setName(''); setStatus('not_started'); setConfidence(1); setSaving(false)
    fetchData()
  }

  const handleDelete = async (topicId: string) => {
    if (!confirm('Delete this topic?')) return
    const supabase = createClient()
    await supabase.from('topics').delete().eq('id', topicId)
    success('Topic deleted')
    fetchData()
  }

  const updateStatus = async (topicId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('topics').update({ status: newStatus }).eq('id', topicId)
    fetchData()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/subjects/${subjectId}`}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            {chapter?.name}
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {topics.length} topics
          </p>
        </div>
        <Button onClick={() => { setEditTopic(null); setName(''); setStatus('not_started'); setConfidence(1); setModalOpen(true) }} icon={<Plus className="w-4 h-4" />}>
          Add Topic
        </Button>
      </div>

      {topics.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No topics yet"
          description="Add topics to track your learning progress."
          action={<Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>Add Topic</Button>}
        />
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => {
            const statusInfo = statusOptions.find(s => s.value === topic.status) || statusOptions[0]
            return (
              <Card key={topic.id} padding="sm" className="group">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">{topic.name}</h3>
                      <Badge variant={statusInfo.color as 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral'} size="sm">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 cursor-pointer transition-colors ${s <= topic.confidence ? 'text-accent-500 fill-accent-500' : 'text-border-light dark:text-border-dark'}`}
                          onClick={() => {
                            const supabase = createClient()
                            supabase.from('topics').update({ confidence: s }).eq('id', topic.id).then(() => fetchData())
                          }}
                        />
                      ))}
                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark ml-1">
                        {topic.confidence}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={topic.status}
                      onChange={(e) => updateStatus(topic.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark cursor-pointer"
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button onClick={() => { setEditTopic(topic); setName(topic.name); setStatus(topic.status); setConfidence(topic.confidence); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5 text-text-muted-light" />
                    </button>
                    <button onClick={() => handleDelete(topic.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTopic ? 'Edit Topic' : 'Add Topic'}>
        <div className="space-y-4">
          <Input label="Topic Name" placeholder="e.g. Newton's Laws, Integration" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${status === s.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border-light dark:border-border-dark hover:border-primary-300'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">Confidence ({confidence}/5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setConfidence(s)} className="cursor-pointer">
                  <Star className={`w-7 h-7 ${s <= confidence ? 'text-accent-500 fill-accent-500' : 'text-border-light dark:text-border-dark'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>{editTopic ? 'Save' : 'Add Topic'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
