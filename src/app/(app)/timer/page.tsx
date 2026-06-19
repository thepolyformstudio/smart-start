'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Play, Pause, RotateCcw, Settings, Timer, Hourglass, BookOpen } from 'lucide-react'
import { awardXP, updateStreak, checkAchievements, sendNotification } from '@/lib/gamification'

type TimerMode = 'pomodoro' | 'stopwatch'

export default function TimerPage() {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 min in seconds
  const [elapsed, setElapsed] = useState(0)
  const [studyDuration, setStudyDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [notes, setNotes] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { success } = useToast()

  useEffect(() => {
    const fetchSubjects = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('subjects').select('id, name').eq('user_id', user.id)
      setSubjects(data || [])
    }
    fetchSubjects()
  }, [])

  const saveSession = useCallback(async (duration: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject_id: selectedSubject || null,
      session_type: mode,
      status: 'completed',
      duration_minutes: Math.max(1, Math.round(duration / 60)),
      notes: notes || null,
      started_at: new Date(Date.now() - duration * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    })

    // Award XP, update streak, check achievements
    const { leveledUp } = await awardXP(20)
    const streak = await updateStreak()
    const newAchievements = await checkAchievements()

    let message = 'Session saved! +20 XP earned 🎉'
    if (leveledUp) message += ' 🎊 Level up!'
    if (streak > 1) message += ` 🔥 ${streak}-day streak!`
    if (newAchievements.length > 0) message += ` 🏆 Achievement unlocked!`
    success(message)

    sendNotification('Study Session Complete!', `+20 XP earned. ${streak > 1 ? `${streak}-day streak!` : 'Keep going!'}`)
  }, [selectedSubject, mode, notes, success])

  // Pomodoro timer
  useEffect(() => {
    if (mode === 'pomodoro' && isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (mode === 'pomodoro' && timeLeft === 0) {
      if (!isBreak) {
        saveSession(studyDuration * 60)
        setSessions((s) => s + 1)
        setIsBreak(true)
        setTimeLeft(breakDuration * 60)
        success('Study session complete! Time for a break 🎉')
        sendNotification('Pomodoro Complete! 🍅', 'Great work! Take a break.')
      } else {
        setIsBreak(false)
        setTimeLeft(studyDuration * 60)
        success('Break over! Ready for another round? 💪')
        sendNotification('Break Over! 💪', 'Ready for another round?')
      }
      setIsRunning(false)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, timeLeft, mode, isBreak, studyDuration, breakDuration, saveSession, success])

  // Stopwatch
  useEffect(() => {
    if (mode === 'stopwatch' && isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1)
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, mode])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsRunning(!isRunning)

  const resetTimer = () => {
    setIsRunning(false)
    if (mode === 'pomodoro') {
      setTimeLeft(studyDuration * 60)
      setIsBreak(false)
    } else {
      if (elapsed > 60) {
        saveSession(elapsed)
      }
      setElapsed(0)
    }
  }

  const progress = mode === 'pomodoro'
    ? ((isBreak ? breakDuration * 60 : studyDuration * 60) - timeLeft) / (isBreak ? breakDuration * 60 : studyDuration * 60) * 100
    : 0

  const currentTime = mode === 'pomodoro' ? timeLeft : elapsed

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">Study Timer</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Stay focused and track your study sessions</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
          <button
            onClick={() => { setMode('pomodoro'); setIsRunning(false); setTimeLeft(studyDuration * 60) }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${mode === 'pomodoro' ? 'bg-primary-500 text-white shadow-lg' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500'}`}
          >
            <Timer className="w-4 h-4" />
            Pomodoro
          </button>
          <button
            onClick={() => { setMode('stopwatch'); setIsRunning(false); setElapsed(0) }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${mode === 'stopwatch' ? 'bg-primary-500 text-white shadow-lg' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500'}`}
          >
            <Hourglass className="w-4 h-4" />
            Stopwatch
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <Card variant="glass" padding="lg" className="text-center">
        {isBreak && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 text-sm font-medium mb-4">
            ☕ Break Time
          </div>
        )}

        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Progress Ring */}
          <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="112" fill="none" stroke="currentColor" strokeWidth="6" className="text-border-light dark:text-border-dark" />
            {mode === 'pomodoro' && (
              <circle
                cx="128" cy="128" r="112" fill="none"
                stroke={isBreak ? '#00B894' : '#6C5CE7'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progress * 7.04} ${704 - progress * 7.04}`}
                className="transition-all duration-1000"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-extrabold text-text-primary-light dark:text-text-primary-dark font-mono tracking-wider">
              {formatTime(currentTime)}
            </span>
            {mode === 'pomodoro' && (
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
                {isBreak ? 'Break' : 'Focus'} · Session {sessions + 1}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className="p-3 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
          <button
            onClick={toggleTimer}
            className={`p-5 rounded-full ${isRunning ? 'bg-danger-500 hover:bg-danger-600' : 'bg-primary-500 hover:bg-primary-600 animate-pulse-glow'} text-white shadow-lg transition-all active:scale-95 cursor-pointer`}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          </button>
        </div>
      </Card>

      {/* Subject Selection */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-primary-500" />
          <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">Session Details</h3>
        </div>
        <div className="space-y-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm"
          >
            <option value="">Select subject (optional)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Session notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm resize-none"
          />
        </div>
      </Card>

      {/* Settings Panel */}
      {showSettings && mode === 'pomodoro' && (
        <Card className="animate-slide-up">
          <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-4">Timer Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Study (min)</label>
              <input
                type="number" min="1" max="120"
                value={studyDuration}
                onChange={(e) => { setStudyDuration(+e.target.value); if (!isRunning) setTimeLeft(+e.target.value * 60) }}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-center"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Break (min)</label>
              <input
                type="number" min="1" max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(+e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-center"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[{ l: '25/5', s: 25, b: 5 }, { l: '50/10', s: 50, b: 10 }, { l: '90/15', s: 90, b: 15 }].map(p => (
              <Button key={p.l} variant="outline" size="sm" onClick={() => {
                setStudyDuration(p.s); setBreakDuration(p.b)
                if (!isRunning) setTimeLeft(p.s * 60)
              }}>{p.l}</Button>
            ))}
          </div>
        </Card>
      )}

      {/* Session Stats */}
      {sessions > 0 && (
        <Card>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-primary-500">{sessions}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-secondary-500">{sessions * studyDuration}m</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Study Time</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-accent-500">+{sessions * 20}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">XP Earned</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
