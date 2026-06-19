'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import { PageLoader, EmptyState } from '@/components/ui/loading'
import {
  BookOpen, Target, Flame, Clock, Brain, CheckCircle,
  Star, TrendingUp, Zap, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format, differenceInDays } from 'date-fns'
import { generateDailyMissions } from '@/lib/gamification'

interface DashboardData {
  profile: { name: string; xp: number; level: number; streak_days: number } | null
  todaysTasks: { id: string; tasks: unknown[] } | null
  revisionDue: number
  upcomingExams: { id: string; name: string; exam_date: string; previous_score: string; target_score: string }[]
  subjectCount: number
  topicStats: { total: number; completed: number }
  todaySessions: { duration_minutes: number }[]
  missions: { missions: { text: string; completed: boolean }[]; xp_reward: number } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = format(new Date(), 'yyyy-MM-dd')

      const [
        profileRes,
        plansRes,
        revisionRes,
        examsRes,
        subjectsRes,
        topicsRes,
        sessionsRes,
        missionsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('name, xp, level, streak_days').eq('id', user.id).single(),
        supabase.from('daily_plans').select('id, tasks').eq('user_id', user.id).eq('plan_date', today).single(),
        supabase.from('revision_schedule').select('id').eq('user_id', user.id).eq('revision_date', today).eq('status', 'pending'),
        supabase.from('exams').select('*').eq('user_id', user.id).gte('exam_date', today).order('exam_date').limit(3),
        supabase.from('subjects').select('id').eq('user_id', user.id),
        supabase.from('topics').select('id, status').eq('user_id', user.id),
        supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).gte('started_at', `${today}T00:00:00`),
        supabase.from('daily_missions').select('missions, xp_reward').eq('user_id', user.id).eq('mission_date', today).single(),
      ])

      const topics = topicsRes.data || []

      // Generate daily missions if they don't exist for today
      let missionsData = missionsRes.data as DashboardData['missions']
      if (!missionsData) {
        await generateDailyMissions()
        const { data: freshMissions } = await supabase
          .from('daily_missions')
          .select('missions, xp_reward')
          .eq('user_id', user.id)
          .eq('mission_date', today)
          .single()
        missionsData = freshMissions as DashboardData['missions']
      }

      setData({
        profile: profileRes.data,
        todaysTasks: plansRes.data,
        revisionDue: revisionRes.data?.length || 0,
        upcomingExams: examsRes.data || [],
        subjectCount: subjectsRes.data?.length || 0,
        topicStats: {
          total: topics.length,
          completed: topics.filter((t: { status: string }) => t.status === 'completed').length,
        },
        todaySessions: sessionsRes.data || [],
        missions: missionsData,
      })
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  if (loading) return <PageLoader />

  const profile = data?.profile
  const studyMinutes = data?.todaySessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0
  const studyHours = Math.round(studyMinutes / 60 * 10) / 10
  const tasks = (data?.todaysTasks?.tasks || []) as { text: string; completed: boolean }[]
  const completedTasks = tasks.filter(t => t.completed).length
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  // Level calculations
  const levelXP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]
  const currentLevelXP = levelXP[(profile?.level || 1) - 1] || 0
  const nextLevelXP = levelXP[profile?.level || 1] || currentLevelXP + 1000
  const levelProgress = ((profile?.xp || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100

  const getLevelTitle = (level: number) => {
    const titles = ['Beginner', 'Learner', 'Student', 'Achiever', 'Scholar', 'Expert', 'Master', 'Guru', 'Legend', 'Champion']
    return titles[Math.min(level - 1, titles.length - 1)]
  }

  if (data?.subjectCount === 0) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Welcome to Smart Start!"
          description="Get started by adding your subjects and setting up your study plan."
          action={
            <Link href="/subjects">
              <Button icon={<BookOpen className="w-4 h-4" />}>Add Your First Subject</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const currentHour = new Date().getHours()
  let timeTheme = "from-primary-500 to-secondary-500"
  let timeGreeting = "Good Afternoon"
  
  if (currentHour < 12) {
    timeTheme = "from-accent-500 to-danger-500"
    timeGreeting = "Good Morning"
  } else if (currentHour >= 18) {
    timeTheme = "from-primary-800 to-primary-900"
    timeGreeting = "Good Evening"
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dynamic Gamified Header */}
      <div className={`relative overflow-hidden rounded-[2rem] p-8 md:p-10 bg-gradient-to-r ${timeTheme} shadow-2xl shadow-primary-500/20 transition-all duration-1000`}>
        <div className="absolute inset-0 bg-white/5 shimmer"></div>
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md">
              Hi, {profile?.name || 'Student'}!
            </h1>
            <p className="text-white/90 text-base md:text-lg font-medium drop-shadow-sm max-w-xl">
              Keep your momentum going. You're doing absolutely great!
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 md:p-5 text-white text-center min-w-[88px] md:min-w-[110px] border border-white/20 shadow-xl transition-transform hover:-translate-y-1 duration-300">
              <Flame className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 animate-flame text-accent-300 drop-shadow-lg" />
              <div className="font-black text-2xl md:text-3xl drop-shadow-md">{profile?.streak_days || 0}</div>
              <div className="text-[10px] md:text-xs font-bold opacity-90 uppercase tracking-widest mt-0.5 md:mt-1">Streak</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3 md:p-5 text-white text-center min-w-[88px] md:min-w-[110px] border border-white/20 shadow-xl transition-transform hover:-translate-y-1 duration-300">
              <Star className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-accent-300 animate-pulse-glow drop-shadow-lg" />
              <div className="font-black text-2xl md:text-3xl drop-shadow-md">Lvl {profile?.level || 1}</div>
              <div className="text-[10px] md:text-xs font-bold opacity-90 uppercase tracking-widest mt-0.5 md:mt-1">Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Ring Card */}
        <Card variant="gradient" padding="lg" hover={false} className="md:col-span-1">
          <div className="text-center">
            <p className="text-white/70 text-sm mb-3">Today&apos;s Progress</p>
            <div className="relative w-28 h-28 mx-auto mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="white" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${taskProgress * 2.64} ${264 - taskProgress * 2.64}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-extrabold text-white">{taskProgress}%</span>
              </div>
            </div>
            <p className="text-white/80 text-sm">
              {completedTasks}/{tasks.length} tasks done
            </p>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="text-center">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-primary-500" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{studyHours}h</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Study Time</p>
          </Card>

          <Card className="text-center">
            <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-secondary-500" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{data?.todaySessions?.length || 0}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Sessions</p>
          </Card>

          <Card className="text-center">
            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-orange-500 animate-flame" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{profile?.streak_days || 0}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Day Streak</p>
          </Card>

          <Card className="text-center">
            <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mx-auto mb-2">
              <Brain className="w-5 h-5 text-danger-500" />
            </div>
            <p className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">{data?.revisionDue || 0}</p>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Revision Due</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-500" />
                Today&apos;s Tasks
              </h3>
              <Link href="/planner">
                <Button variant="ghost" size="sm">View Planner</Button>
              </Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm mb-3">
                  No tasks planned for today
                </p>
                <Link href="/planner">
                  <Button size="sm" variant="outline">Generate Plan</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${task.completed ? 'bg-secondary-50 dark:bg-secondary-900/10' : 'bg-surface-elevated-light dark:bg-surface-elevated-dark'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-secondary-500 border-secondary-500' : 'border-border-light dark:border-border-dark'}`}>
                      {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${task.completed ? 'line-through text-text-muted-light dark:text-text-muted-dark' : 'text-text-primary-light dark:text-text-primary-dark'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Subject Progress */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary-500" />
                Overall Progress
              </h3>
              <Link href="/subjects">
                <Button variant="ghost" size="sm">All Subjects</Button>
              </Link>
            </div>
            <ProgressBar
              value={data?.topicStats?.completed || 0}
              max={data?.topicStats?.total || 1}
              label={`${data?.topicStats?.completed}/${data?.topicStats?.total} topics completed`}
              color="secondary"
            />
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Level & XP */}
          <Card>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-sm font-bold mb-2">
                <Star className="w-4 h-4" />
                {getLevelTitle(profile?.level || 1)} Level {profile?.level || 1}
              </div>
              <p className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                {profile?.xp || 0} <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">XP</span>
              </p>
            </div>
            <ProgressBar
              value={levelProgress}
              max={100}
              label={`${nextLevelXP - (profile?.xp || 0)} XP to next level`}
              color="accent"
            />
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-danger-500" />
              Upcoming Exams
            </h3>
            {data?.upcomingExams?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
                  No upcoming exams
                </p>
                <Link href="/exams">
                  <Button size="sm" variant="outline">Add Exam</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.upcomingExams?.map((exam) => {
                  const daysLeft = differenceInDays(new Date(exam.exam_date), new Date())
                  return (
                    <div key={exam.id} className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">{exam.name}</p>
                        <Badge variant={daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'accent' : 'primary'}>
                          {daysLeft}d left
                        </Badge>
                      </div>
                      {exam.previous_score && (
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                          {exam.previous_score} → {exam.target_score}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Daily Missions */}
          <Card>
            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent-500" />
              Daily Missions
            </h3>
            {data?.missions ? (
              <div className="space-y-2">
                {(data.missions.missions as { text: string; completed: boolean }[]).map((mission, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${mission.completed ? 'bg-accent-500 border-accent-500' : 'border-border-light dark:border-border-dark'}`}>
                      {mission.completed && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={mission.completed ? 'line-through text-text-muted-light dark:text-text-muted-dark' : 'text-text-primary-light dark:text-text-primary-dark'}>
                      {mission.text}
                    </span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark text-center">
                  <Badge variant="accent">
                    <Zap className="w-3 h-3" /> +{data.missions.xp_reward} XP reward
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                  Missions will appear once you add subjects
                </p>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card>
            <h3 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark mb-3 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/timer">
                <div className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 text-center transition-colors">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                  <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">Start Timer</span>
                </div>
              </Link>
              <Link href="/revision">
                <div className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 text-center transition-colors">
                  <Brain className="w-5 h-5 mx-auto mb-1 text-secondary-500" />
                  <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">Revision</span>
                </div>
              </Link>
              <Link href="/mistakes">
                <div className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 text-center transition-colors">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-accent-500" />
                  <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">Mistakes</span>
                </div>
              </Link>
              <Link href="/analytics">
                <div className="p-3 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 text-center transition-colors">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-danger-500" />
                  <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">Analytics</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
