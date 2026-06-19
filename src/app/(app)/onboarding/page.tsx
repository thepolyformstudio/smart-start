'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { useToast } from '@/components/ui/toast'
import {
  User, BookOpen, Clock, Target, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, Sparkles
} from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { success, error: showError } = useToast()

  // Step 1: Profile
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [classYear, setClassYear] = useState('')

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<{ name: string; chapters: { name: string; topics: string[] }[] }[]>([])
  const [newSubject, setNewSubject] = useState('')

  // Step 3: Availability
  const [availability, setAvailability] = useState<{ day: number; start: string; end: string }[]>([
    { day: 1, start: '19:00', end: '22:00' },
    { day: 2, start: '19:00', end: '22:00' },
    { day: 3, start: '19:00', end: '22:00' },
    { day: 4, start: '19:00', end: '22:00' },
    { day: 5, start: '19:00', end: '22:00' },
    { day: 6, start: '10:00', end: '14:00' },
    { day: 0, start: '10:00', end: '14:00' },
  ])

  // Step 4: Exams
  const [exams, setExams] = useState<{ name: string; date: string; prevScore: string; targetScore: string }[]>([])

  const addSubject = () => {
    if (!newSubject.trim()) return
    setSubjects([...subjects, { name: newSubject, chapters: [] }])
    setNewSubject('')
  }

  const removeSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx))
  }

  const addExam = () => {
    setExams([...exams, { name: '', date: '', prevScore: '', targetScore: '' }])
  }

  const updateExam = (idx: number, field: string, value: string) => {
    const updated = [...exams]
    updated[idx] = { ...updated[idx], [field]: value }
    setExams(updated)
  }

  const handleComplete = async () => {
    if (!name.trim()) { showError('Please enter your name'); setStep(0); return }
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save profile
      await supabase.from('profiles').update({
        name, age: age ? parseInt(age) : null, class_year: classYear || null, onboarding_completed: true,
      }).eq('id', user.id)

      // Save subjects
      for (const subject of subjects) {
        const { data: subjectData } = await supabase.from('subjects').insert({
          name: subject.name, user_id: user.id, order_index: subjects.indexOf(subject),
        }).select('id').single()
        if (subjectData) {
          for (const chapter of subject.chapters) {
            const { data: chapterData } = await supabase.from('chapters').insert({
              name: chapter.name, subject_id: subjectData.id, user_id: user.id,
            }).select('id').single()
            if (chapterData) {
              for (const topic of chapter.topics) {
                await supabase.from('topics').insert({
                  name: topic, chapter_id: chapterData.id, user_id: user.id,
                })
              }
            }
          }
        }
      }

      // Save availability
      for (const slot of availability) {
        await supabase.from('availability').insert({
          user_id: user.id, day_of_week: slot.day, start_time: slot.start, end_time: slot.end,
        })
      }

      // Save exams
      for (const exam of exams) {
        if (exam.name && exam.date) {
          await supabase.from('exams').insert({
            user_id: user.id, name: exam.name, exam_date: exam.date,
            previous_score: exam.prevScore || null, target_score: exam.targetScore || null,
          })
        }
      }

      success('Setup complete! 🎉')
      router.push('/dashboard')
      router.refresh()
    } catch {
      showError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    { icon: <User className="w-5 h-5" />, title: 'Profile', desc: 'Tell us about yourself' },
    { icon: <BookOpen className="w-5 h-5" />, title: 'Subjects', desc: 'Add your subjects' },
    { icon: <Clock className="w-5 h-5" />, title: 'Schedule', desc: 'Set study hours' },
    { icon: <Target className="w-5 h-5" />, title: 'Exams', desc: 'Upcoming exams' },
    { icon: <Sparkles className="w-5 h-5" />, title: 'Ready!', desc: 'Let\'s begin' },
  ]

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            Let&apos;s Set You Up 🚀
          </h1>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-primary-500 text-white' : 'bg-border-light dark:bg-border-dark text-text-muted-light dark:text-text-muted-dark'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 ${i < step ? 'bg-primary-500' : 'bg-border-light dark:bg-border-dark'}`} />
              )}
            </div>
          ))}
        </div>

        <Card variant="glass" padding="lg">
          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                {steps[0].title}
              </h2>
              <Input label="Your Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              <Input label="Age" type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} />
              <Input label="Class / Year" placeholder="e.g. 12th, BSc 2nd Year" value={classYear} onChange={(e) => setClassYear(e.target.value)} />
            </div>
          )}

          {/* Step 1: Subjects */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Add Your Subjects
              </h2>
              <div className="flex gap-2">
                <Input placeholder="e.g. Physics" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSubject() }} />
                <Button onClick={addSubject} icon={<Plus className="w-4 h-4" />}>Add</Button>
              </div>
              <div className="space-y-2">
                {subjects.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{s.name}</span>
                    <button onClick={() => removeSubject(i)} className="text-danger-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                You can add chapters and topics later from the Subjects page.
              </p>
            </div>
          )}

          {/* Step 2: Availability */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Study Schedule
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Set your available study hours for each day
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availability.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                    <span className="text-sm font-medium w-20 text-text-primary-light dark:text-text-primary-dark">{DAYS[slot.day].slice(0, 3)}</span>
                    <input type="time" value={slot.start}
                      onChange={(e) => { const u = [...availability]; u[i].start = e.target.value; setAvailability(u) }}
                      className="px-2 py-1 rounded-lg text-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark"
                    />
                    <span className="text-text-muted-light dark:text-text-muted-dark text-sm">to</span>
                    <input type="time" value={slot.end}
                      onChange={(e) => { const u = [...availability]; u[i].end = e.target.value; setAvailability(u) }}
                      className="px-2 py-1 rounded-lg text-sm border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Exams */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Upcoming Exams (Optional)
              </h2>
              {exams.map((exam, i) => (
                <div key={i} className="space-y-2 p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                  <Input placeholder="Exam name" value={exam.name} onChange={(e) => updateExam(i, 'name', e.target.value)} />
                  <Input type="date" label="Date" value={exam.date} onChange={(e) => updateExam(i, 'date', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Previous score" value={exam.prevScore} onChange={(e) => updateExam(i, 'prevScore', e.target.value)} />
                    <Input placeholder="Target score" value={exam.targetScore} onChange={(e) => updateExam(i, 'targetScore', e.target.value)} />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExam} icon={<Plus className="w-4 h-4" />} className="w-full">Add Exam</Button>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center space-y-4 animate-bounce-in py-8">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                You&apos;re All Set!
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Your study companion is ready. Let&apos;s start your journey!
              </p>
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="text-center">
                  <p className="text-2xl font-bold gradient-text">{subjects.length}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Subjects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold gradient-text">{availability.length}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold gradient-text">{exams.length}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Exams</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
            ) : <div />}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} icon={<ArrowRight className="w-4 h-4" />}>Next</Button>
            ) : (
              <Button onClick={handleComplete} isLoading={saving} icon={<Sparkles className="w-4 h-4" />}>
                Go to the dashboard
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
