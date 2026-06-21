'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Calendar, Zap, CheckCircle, SkipForward, BookOpen, Clock, Brain, Plus, Trash2, AlertTriangle, History } from 'lucide-react'
import { format } from 'date-fns'
import { awardXP, updateStreak, checkAchievements } from '@/lib/gamification'

interface PlanTask {
  id: string
  text: string
  subject: string
  type: 'revision' | 'practice' | 'weak_area' | 'custom'
  startTime: string
  endTime: string
  completed: boolean
  skipped: boolean
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<PlanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [planExists, setPlanExists] = useState(false)
  const [customMins, setCustomMins] = useState('')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ text: '', subject_id: '', chapter_id: '', topic_id: '', date: format(new Date(), 'yyyy-MM-dd'), duration: '30' })
  const [subjectsList, setSubjectsList] = useState<{ id: string, name: string }[]>([])
  const [chaptersList, setChaptersList] = useState<{ id: string, name: string }[]>([])
  const [topicsList, setTopicsList] = useState<{ id: string, name: string }[]>([])
  const [savingTask, setSavingTask] = useState(false)
  // Delete / Move modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; task: PlanTask | null }>({ open: false, task: null })
  const [moveDate, setMoveDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  // Incomplete past tasks
  const [pastIncompleteTasks, setPastIncompleteTasks] = useState<{ text: string; subject: string; from: string }[]>([])
  const { success, error } = useToast()

  const today = format(new Date(), 'yyyy-MM-dd')

  const fetchPlan = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: subs } = await supabase.from('subjects').select('id, name').eq('user_id', user.id)
    if (subs) {
      const uniqueSubs = subs.filter((s, index, self) => 
        index === self.findIndex((t) => t.name === s.name)
      );
      setSubjectsList(uniqueSubs)
    }

    const { data } = await supabase
      .from('daily_plans')
      .select('tasks')
      .eq('user_id', user.id)
      .eq('plan_date', today)
      .single()

    if (data) {
      setTasks(data.tasks as PlanTask[])
      setPlanExists(true)
    }
    setLoading(false)
  }, [today])

  const fetchIncompletePastTasks = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all plans from the last 14 days (excluding today)
    const { data } = await supabase
      .from('daily_plans')
      .select('plan_date, tasks')
      .eq('user_id', user.id)
      .lt('plan_date', today)
      .gte('plan_date', format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      .order('plan_date', { ascending: false })

    if (!data) return
    const incomplete: { text: string; subject: string; from: string }[] = []
    for (const plan of data) {
      const planTasks = (plan.tasks as PlanTask[]) || []
      for (const t of planTasks) {
        if (!t.completed && !t.skipped && t.text !== 'Break' && t.text !== 'Daily Reflection') {
          incomplete.push({ text: t.text, subject: t.subject, from: plan.plan_date })
        }
      }
    }
    setPastIncompleteTasks(incomplete.slice(0, 10)) // cap at 10
  }, [today])

  useEffect(() => { fetchPlan(); fetchIncompletePastTasks() }, [fetchPlan, fetchIncompletePastTasks])

  const handleDeleteTask = (task: PlanTask) => {
    setDeleteModal({ open: true, task })
    setMoveDate(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')) // default to tomorrow
  }

  const handleDeleteConfirm = async (action: 'delete' | 'move') => {
    if (!deleteModal.task) return
    const task = deleteModal.task
    // Remove from today's plan
    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('daily_plans').update({ tasks: updated }).eq('user_id', user.id).eq('plan_date', today)

    if (action === 'move') {
      // Add to custom_tasks on the target date
      await supabase.from('custom_tasks').insert({
        user_id: user.id,
        task_text: task.text,
        task_date: moveDate,
        duration_minutes: 45,
      })
      success(`Task moved to ${format(new Date(moveDate + 'T00:00:00'), 'MMM d, yyyy')} ✓`)
    } else {
      success('Task removed from plan.')
    }
    setDeleteModal({ open: false, task: null })
  }

  const addPastTaskToToday = async (task: { text: string; subject: string; from: string }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('custom_tasks').insert({
      user_id: user.id,
      task_text: task.text,
      task_date: today,
      duration_minutes: 45,
    })
    setPastIncompleteTasks(prev => prev.filter(t => !(t.text === task.text && t.from === task.from)))
    success(`"${task.text}" added to today's plan!`)
    generatePlan()
  }

  const handleSubjectChange = async (subjectId: string) => {
    setTaskForm(prev => ({ ...prev, subject_id: subjectId, chapter_id: '', topic_id: '', text: '' }))
    setChaptersList([])
    setTopicsList([])
    if (!subjectId) return
    const supabase = createClient()
    const { data } = await supabase.from('chapters').select('id, name').eq('subject_id', subjectId).order('order_index')
    setChaptersList(data || [])
  }

  const handleChapterChange = async (chapterId: string) => {
    setTaskForm(prev => ({ ...prev, chapter_id: chapterId, topic_id: '', text: '' }))
    setTopicsList([])
    if (!chapterId) return
    const supabase = createClient()
    const { data } = await supabase.from('topics').select('id, name').eq('chapter_id', chapterId).order('name')
    setTopicsList(data || [])
    // Auto-fill description with chapter name
    const chapter = chaptersList.find(c => c.id === chapterId)
    if (chapter) setTaskForm(prev => ({ ...prev, chapter_id: chapterId, text: `Study: ${chapter.name}` }))
  }

  const handleTopicChange = (topicId: string) => {
    const topic = topicsList.find(t => t.id === topicId)
    setTaskForm(prev => ({
      ...prev,
      topic_id: topicId,
      text: topic ? `Study: ${topic.name}` : prev.text,
    }))
  }

  const handleAddTask = async () => {
    if (!taskForm.text.trim()) { error('Task description is required'); return }
    setSavingTask(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('custom_tasks').insert({
      user_id: user.id,
      task_text: taskForm.text.trim(),
      subject_id: taskForm.subject_id || null,
      task_date: taskForm.date,
      duration_minutes: parseInt(taskForm.duration) || 30
    })

    setSavingTask(false)
    setTaskModalOpen(false)
    setTaskForm({ text: '', subject_id: '', chapter_id: '', topic_id: '', date: today, duration: '30' })
    setChaptersList([])
    setTopicsList([])
    success('Task scheduled successfully!')

    // Automatically regenerate if they schedule it for today
    if (taskForm.date === today) {
      generatePlan()
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dayOfWeek = new Date().getDay()

    // Fetch availability for today
    const { data: avail } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek)

    // Fetch subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('user_id', user.id)

    // Fetch pending revision
    const { data: revisions } = await supabase
      .from('revision_schedule')
      .select('id, topic_id, topics(name, chapters(subjects(name)))')
      .eq('user_id', user.id)
      .eq('revision_date', today)
      .eq('status', 'pending')
      .limit(5)

    // Fetch scheduled mistakes
    const { data: scheduledMistakes } = await supabase
      .from('mistakes')
      .select('id, mistake, subjects(name)')
      .eq('user_id', user.id)
      .eq('review_date', today)
      .eq('is_corrected', false)

    // Fetch custom tasks
    const { data: customTasks } = await supabase
      .from('custom_tasks')
      .select('id, task_text, duration_minutes, subjects(name)')
      .eq('user_id', user.id)
      .eq('task_date', today)
      .eq('is_completed', false)

    // Fetch weak topics
    const { data: weakTopics } = await supabase
      .from('topics')
      .select('id, name, confidence, chapters(subjects(name))')
      .eq('user_id', user.id)
      .lte('confidence', 2)
      .limit(3)

    let startMinutes = 19 * 60;
    let endMinutes = 20 * 60; // 1 hour default
    let isDefault = true;

    if (customMins && parseInt(customMins) > 0) {
      startMinutes = new Date().getHours() * 60; // Start now
      endMinutes = startMinutes + parseInt(customMins);
      isDefault = false;
    } else if (avail && avail.length > 0) {
      const startTime = avail[0].start_time
      const endTime = avail[0].end_time
      startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
      endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
      isDefault = false;
    }

    if (!subjects?.length) {
      // Generate a basic plan
      const defaultTasks: PlanTask[] = (subjects || []).slice(0, 4).map((s, i) => ({
        id: `task-${i}`,
        text: `Study ${s.name}`,
        subject: s.name,
        type: 'practice' as const,
        startTime: `${19 + i}:00`,
        endTime: `${19 + i}:45`,
        completed: false,
        skipped: false,
      }))
      defaultTasks.push({ id: 'break-1', text: 'Break', subject: '', type: 'practice', startTime: '19:45', endTime: '20:00', completed: false, skipped: false })

      await supabase.from('daily_plans').upsert({
        user_id: user.id, plan_date: today, tasks: defaultTasks,
      }, { onConflict: 'user_id,plan_date' })

      setTasks(defaultTasks)
      setPlanExists(true)
      setGenerating(false)
      success('Plan generated!')
      return
    }

    console.log("SCHEDULED MISTAKES FOR TODAY:", scheduledMistakes);

    const totalMinutes = endMinutes - startMinutes

    const formatTime = (totalMins: number) => {
      const m = totalMins % 1440; // Wrap around 24 hours (1440 minutes)
      const hours24 = Math.floor(m / 60);
      const mins = m % 60;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;
    }

    const generatedTasks: PlanTask[] = []
    let currentMinute = startMinutes
    let taskId = 0

    // High Priority 1: Custom Tasks
    if (customTasks?.length && currentMinute < endMinutes) {
      for (const t of customTasks) {
        if (currentMinute >= endMinutes) break;
        const dur = Math.min(t.duration_minutes, endMinutes - currentMinute);
        generatedTasks.push({
          id: `custom-${t.id}`,
          text: t.task_text,
          subject: (t.subjects as unknown as { name: string })?.name || '',
          type: 'custom',
          startTime: formatTime(currentMinute),
          endTime: formatTime(currentMinute + dur),
          completed: false, skipped: false,
        })
        currentMinute += dur;
        
        if (currentMinute < endMinutes) {
           generatedTasks.push({ id: `break-${taskId++}`, text: 'Break', subject: '', type: 'practice', startTime: formatTime(currentMinute), endTime: formatTime(currentMinute + 5), completed: false, skipped: false })
           currentMinute += 5;
        }
      }
    }

    // High Priority 2: Scheduled Mistakes
    if (scheduledMistakes?.length && currentMinute < endMinutes) {
      for (const mistake of scheduledMistakes) {
        if (currentMinute >= endMinutes) break;
        const dur = Math.min(30, endMinutes - currentMinute);
        generatedTasks.push({
          id: `task-${taskId++}`,
          text: `Review Mistake: ${mistake.mistake.length > 30 ? mistake.mistake.substring(0, 30) + '...' : mistake.mistake}`,
          subject: (mistake.subjects as unknown as { name: string })?.name || '',
          type: 'weak_area',
          startTime: formatTime(currentMinute),
          endTime: formatTime(currentMinute + dur),
          completed: false, skipped: false,
        })
        currentMinute += dur;
        
        // Add a short break if more tasks coming
        if (currentMinute < endMinutes) {
           generatedTasks.push({ id: `break-${taskId++}`, text: 'Break', subject: '', type: 'practice', startTime: formatTime(currentMinute), endTime: formatTime(currentMinute + 5), completed: false, skipped: false })
           currentMinute += 5;
        }
      }
    }

    // 40% revision
    const revisionTime = Math.floor(totalMinutes * 0.4)
    const revisionBlocks = Math.ceil(revisionTime / 45)
    for (let i = 0; i < revisionBlocks && currentMinute < endMinutes; i++) {
      const rev = revisions?.[i]
      const dur = Math.min(45, endMinutes - currentMinute)
      generatedTasks.push({
        id: `task-${taskId++}`,
        text: rev ? `Revise: ${(rev.topics as unknown as { name: string })?.name || 'Topic'}` : `${subjects[i % subjects.length]?.name || 'Subject'} Revision`,
        subject: rev ? ((rev.topics as unknown as { chapters: { subjects: { name: string } } })?.chapters?.subjects?.name || '') : (subjects[i % subjects.length]?.name || ''),
        type: 'revision',
        startTime: formatTime(currentMinute),
        endTime: formatTime(currentMinute + dur),
        completed: false, skipped: false,
      })
      currentMinute += dur
      if (currentMinute < endMinutes) {
        generatedTasks.push({ id: `break-${taskId++}`, text: 'Break', subject: '', type: 'practice', startTime: formatTime(currentMinute), endTime: formatTime(currentMinute + 15), completed: false, skipped: false })
        currentMinute += 15
      }
    }

    // 40% practice
    const practiceBlocks = Math.ceil((totalMinutes * 0.4) / 45)
    for (let i = 0; i < practiceBlocks && currentMinute < endMinutes; i++) {
      const dur = Math.min(45, endMinutes - currentMinute)
      generatedTasks.push({
        id: `task-${taskId++}`,
        text: `${subjects[i % subjects.length]?.name || 'Subject'} Practice`,
        subject: subjects[i % subjects.length]?.name || '',
        type: 'practice',
        startTime: formatTime(currentMinute),
        endTime: formatTime(currentMinute + dur),
        completed: false, skipped: false,
      })
      currentMinute += dur + 15
    }

    // Scheduled Mistakes
    if (scheduledMistakes?.length && currentMinute < endMinutes) {
      for (const mistake of scheduledMistakes) {
        if (currentMinute >= endMinutes) break;
        const dur = Math.min(30, endMinutes - currentMinute);
        generatedTasks.push({
          id: `task-${taskId++}`,
          text: `Review Mistake: ${mistake.mistake.length > 30 ? mistake.mistake.substring(0, 30) + '...' : mistake.mistake}`,
          subject: (mistake.subjects as unknown as { name: string })?.name || '',
          type: 'weak_area',
          startTime: formatTime(currentMinute),
          endTime: formatTime(currentMinute + dur),
          completed: false, skipped: false,
        })
        currentMinute += dur;
      }
    }

    // 20% weak areas (if time permits)
    if (weakTopics?.length && currentMinute < endMinutes) {
      const dur = Math.min(45, endMinutes - currentMinute)
      generatedTasks.push({
        id: `task-${taskId++}`,
        text: `Weak Area: ${(weakTopics[0] as unknown as { name: string })?.name || 'Review'}`,
        subject: ((weakTopics[0] as unknown as { chapters: { subjects: { name: string } } })?.chapters?.subjects?.name || ''),
        type: 'weak_area',
        startTime: formatTime(currentMinute),
        endTime: formatTime(currentMinute + dur),
        completed: false, skipped: false,
      })
      currentMinute += dur;
    }

    // Daily reflection at end
    generatedTasks.push({
      id: `reflection-${taskId}`,
      text: 'Daily Reflection',
      subject: '',
      type: 'practice',
      startTime: formatTime(endMinutes - 15),
      endTime: formatTime(endMinutes),
      completed: false, skipped: false,
    })

    await supabase.from('daily_plans').upsert({
      user_id: user.id, plan_date: today, tasks: generatedTasks,
    }, { onConflict: 'user_id,plan_date' })

    setTasks(generatedTasks)
    setPlanExists(true)
    setGenerating(false)
    success('Plan generated based on your schedule! 📋')
  }

  const toggleTask = async (taskId: string, field: 'completed' | 'skipped') => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, [field]: !t[field] } : t
    )
    setTasks(updated)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('daily_plans').update({ tasks: updated }).eq('user_id', user.id).eq('plan_date', today)

    // Check if task was just completed (not toggling off)
    const task = tasks.find(t => t.id === taskId)
    if (field === 'completed' && task && !task.completed) {
      // Award XP for completing a task
      await awardXP(5)

      // Check if all non-break tasks are now completed
      const nonBreakTasks = updated.filter(t => t.text !== 'Break' && t.text !== 'Daily Reflection')
      const allCompleted = nonBreakTasks.every(t => t.completed || t.skipped)
      if (allCompleted && nonBreakTasks.length > 0) {
        await awardXP(25) // Bonus for completing all tasks
        await updateStreak()
        await checkAchievements()
        success('All tasks completed! +25 bonus XP 🎉')
      }
    }
  }

  const typeIcons = {
    revision: <Brain className="w-4 h-4 text-primary-500" />,
    practice: <BookOpen className="w-4 h-4 text-secondary-500" />,
    weak_area: <Zap className="w-4 h-4 text-danger-500" />,
    custom: <CheckCircle className="w-4 h-4 text-accent-500" />,
  }

  const typeColors = {
    revision: 'primary',
    practice: 'secondary',
    weak_area: 'danger',
    custom: 'accent',
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-500" />
            Daily Planner
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            type="number" 
            placeholder="Study time (mins)..." 
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            className="w-full sm:w-48"
          />
          <Button variant="secondary" onClick={() => setTaskModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add a Task
          </Button>
          <Button onClick={generatePlan} isLoading={generating} icon={<Zap className="w-4 h-4" />} className={planExists ? '' : 'animate-pulse-glow'}>
            {planExists ? 'Regenerate Plan' : 'Generate Plan'}
          </Button>
        </div>
      </div>

      {/* Distribution Legend */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="primary"><Brain className="w-3 h-3" /> 40% Revision</Badge>
        <Badge variant="secondary"><BookOpen className="w-3 h-3" /> 40% Practice</Badge>
        <Badge variant="danger"><Zap className="w-3 h-3" /> 20% Weak Areas</Badge>
      </div>

      {!planExists ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No plan for today"
          description="Generate a personalized study plan based on your schedule and priorities."
          action={<Button onClick={generatePlan} isLoading={generating} icon={<Zap className="w-4 h-4" />}>Generate Plan</Button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} padding="sm" className={`${task.completed ? 'opacity-60' : ''} ${task.skipped ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center text-xs text-text-muted-light dark:text-text-muted-dark min-w-[60px]">
                  <Clock className="w-3 h-3 mb-0.5" />
                  <span>{task.startTime}</span>
                  <span>{task.endTime}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {typeIcons[task.type]}
                    <span className={`font-medium ${task.completed ? 'line-through' : ''} text-text-primary-light dark:text-text-primary-dark`}>
                      {task.text}
                    </span>
                  </div>
                  {task.subject && (
                    <Badge variant={typeColors[task.type] as 'primary' | 'secondary' | 'danger'} size="sm" className="mt-1">
                      {task.subject}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleTask(task.id, 'completed')}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${task.completed ? 'bg-secondary-100 dark:bg-secondary-900/30' : 'hover:bg-secondary-50 dark:hover:bg-secondary-900/10'}`}>
                    <CheckCircle className={`w-4 h-4 ${task.completed ? 'text-secondary-500' : 'text-border-light dark:text-border-dark'}`} />
                  </button>
                  <button onClick={() => toggleTask(task.id, 'skipped')}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${task.skipped ? 'bg-accent-100 dark:bg-accent-900/30' : 'hover:bg-accent-50 dark:hover:bg-accent-900/10'}`}>
                    <SkipForward className={`w-4 h-4 ${task.skipped ? 'text-accent-500' : 'text-border-light dark:text-border-dark'}`} />
                  </button>
                  {task.text !== 'Break' && task.text !== 'Daily Reflection' && (
                    <button onClick={() => handleDeleteTask(task)}
                      className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-danger-50 dark:hover:bg-danger-900/20">
                      <Trash2 className="w-4 h-4 text-danger-400" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Incomplete Tasks from Previous Days */}
      {pastIncompleteTasks.length > 0 && (
        <Card className="border-2 border-dashed border-accent-300 dark:border-accent-700 bg-accent-50/30 dark:bg-accent-900/10">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-accent-500" />
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">Incomplete from Previous Days</h3>
            <Badge variant="accent" size="sm">{pastIncompleteTasks.length}</Badge>
          </div>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3">
            These tasks were not completed on their scheduled day. Tap to add to today's plan.
          </p>
          <div className="space-y-2">
            {pastIncompleteTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">{t.text}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    {t.subject && <span className="mr-2">{t.subject} ·</span>}
                    Missed on {format(new Date(t.from + 'T00:00:00'), 'MMM d')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addPastTaskToToday(t)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Today
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delete / Move Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, task: null })}
        title="Remove Task"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
            <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-danger-700 dark:text-danger-300 text-sm">Removing task:</p>
              <p className="text-sm text-danger-600 dark:text-danger-400 mt-0.5">{deleteModal.task?.text}</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">What would you like to do with this task?</p>
          {/* Move date picker */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Move to date</label>
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => handleDeleteConfirm('move')}
            >
              Move to Selected Date
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDeleteConfirm('delete')}
            >
              Delete Permanently
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setDeleteModal({ open: false, task: null })}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal isOpen={taskModalOpen} onClose={() => { setTaskModalOpen(false); setChaptersList([]); setTopicsList([]) }} title="Schedule a Task">
        <div className="space-y-4">

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Subject</label>
            <select value={taskForm.subject_id} onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm">
              <option value="">— Select a subject (optional) —</option>
              {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Chapter — shown only when subject selected */}
          {chaptersList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Chapter</label>
              <select value={taskForm.chapter_id} onChange={(e) => handleChapterChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm">
                <option value="">— Select a chapter (optional) —</option>
                {chaptersList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Topic — shown only when chapter selected */}
          {topicsList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Topic</label>
              <select value={taskForm.topic_id} onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm">
                <option value="">— Select a topic (optional) —</option>
                {topicsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Task Description — auto-filled but editable */}
          <Input
            label="Task Description"
            placeholder="E.g., Study Chapter 3 - Laws of Motion"
            value={taskForm.text}
            onChange={(e) => setTaskForm({ ...taskForm, text: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Date"
              value={taskForm.date}
              onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
            />
            <Input
              type="number"
              label="Duration (mins)"
              value={taskForm.duration}
              onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })}
            />
          </div>
          <Button className="w-full" onClick={handleAddTask} isLoading={savingTask}>
            Schedule Task
          </Button>
        </div>
      </Modal>
    </div>
  )
}
