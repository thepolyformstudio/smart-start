'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, MessageSquareHeart, Bug, Lightbulb, Smile,
  Star, Clock, AlertTriangle, Trash2, UserX, ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'

type FeedbackType = 'bug' | 'feature' | 'general' | 'praise'
type Tab = 'feedback' | 'users'

interface FeedbackRow {
  id: string
  type: FeedbackType
  rating: number | null
  message: string
  created_at: string
  profiles: { name: string } | null
}

interface UserRow {
  id: string
  name: string
  email: string
  xp: number
  level: number
  streak_days: number
  is_admin: boolean
  created_at: string
}

const typeStyle: Record<FeedbackType, { icon: React.ReactNode; label: string; badge: 'primary' | 'danger' | 'accent' | 'secondary' }> = {
  general: { icon: <MessageSquareHeart className="w-4 h-4" />, label: 'General', badge: 'primary' },
  bug:     { icon: <Bug className="w-4 h-4" />,              label: 'Bug',     badge: 'danger' },
  feature: { icon: <Lightbulb className="w-4 h-4" />,        label: 'Feature', badge: 'accent' },
  praise:  { icon: <Smile className="w-4 h-4" />,            label: 'Praise',  badge: 'secondary' },
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [tab, setTab] = useState<Tab>('feedback')
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [stats, setStats] = useState({ total_users: 0, total_sessions: 0, total_feedback: 0 })
  const [sessionToken, setSessionToken] = useState('')
  const { success, error: showError } = useToast()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setSessionToken(session.access_token)

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!profile?.is_admin) { setUnauthorized(true); setLoading(false); return }

      const [feedbackRes, usersRes, sessionsRes, feedbackCountRes, usersListRes] = await Promise.all([
        supabase
          .from('feedback')
          .select('id, type, rating, message, created_at, profiles(name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('study_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id, name, xp, level, streak_days, is_admin, created_at')
          .order('created_at', { ascending: false }),
      ])

      setFeedback((feedbackRes.data as unknown as FeedbackRow[]) || [])
      setUsers((usersListRes.data as unknown as UserRow[]) || [])
      setStats({
        total_users: usersRes.count || 0,
        total_sessions: sessionsRes.count || 0,
        total_feedback: feedbackCountRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [router])

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${userName}"? This action cannot be undone.`)) return

    setDeletingId(userId)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()
      if (!res.ok) { showError(data.error || 'Failed to delete user'); return }

      success(`${userName} has been removed successfully.`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => ({ ...prev, total_users: prev.total_users - 1 }))
    } catch {
      showError('An unexpected error occurred.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <PageLoader />

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-danger-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">Access Denied</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-sm">
          You do not have permission to view this page. Admin access is required.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 bg-gradient-to-r from-danger-500 to-primary-600 shadow-2xl shadow-danger-500/20">
        <div className="absolute inset-0 bg-white/5 shimmer"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white drop-shadow-md">Admin Panel</h1>
            <p className="text-white/80 font-medium">Dareal · Smart Start</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center" padding="lg">
          <Users className="w-8 h-8 text-primary-500 mx-auto mb-3" />
          <p className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark">{stats.total_users}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Registered Users</p>
        </Card>
        <Card className="text-center" padding="lg">
          <Clock className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
          <p className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark">{stats.total_sessions}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Study Sessions</p>
        </Card>
        <Card className="text-center" padding="lg">
          <MessageSquareHeart className="w-8 h-8 text-accent-500 mx-auto mb-3" />
          <p className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark">{stats.total_feedback}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Feedback Submissions</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setTab('feedback')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all cursor-pointer ${tab === 'feedback' ? 'bg-primary-500 text-white shadow-md' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500'}`}
        >
          <span className="flex items-center gap-2"><MessageSquareHeart className="w-4 h-4" /> Feedback</span>
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all cursor-pointer ${tab === 'users' ? 'bg-primary-500 text-white shadow-md' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500'}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Manage Users</span>
        </button>
      </div>

      {/* Feedback Tab */}
      {tab === 'feedback' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <MessageSquareHeart className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">All User Feedback</h2>
            <span className="ml-auto text-sm text-text-muted-light dark:text-text-muted-dark">Latest {feedback.length}</span>
          </div>
          {feedback.length === 0 ? (
            <p className="text-center text-text-muted-light dark:text-text-muted-dark py-10">No feedback submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => {
                const ts = typeStyle[fb.type]
                return (
                  <div key={fb.id} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-light dark:border-border-dark">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={ts.badge} size="sm">
                          <span className="flex items-center gap-1">{ts.icon} {ts.label}</span>
                        </Badge>
                        <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {fb.profiles?.name || 'Unknown User'}
                        </span>
                        {fb.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-accent-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" /> {fb.rating}/5
                          </span>
                        )}
                        <span className="ml-auto text-xs text-text-muted-light dark:text-text-muted-dark">
                          {format(new Date(fb.created_at), 'MMM d, yyyy · h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary-light dark:text-text-primary-dark leading-relaxed">{fb.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Registered Users</h2>
            <span className="ml-auto text-sm text-text-muted-light dark:text-text-muted-dark">{users.length} total</span>
          </div>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-light dark:border-border-dark">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark truncate">{u.name || 'Unnamed'}</p>
                    {u.is_admin && <Badge variant="danger" size="sm">Admin</Badge>}
                  </div>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                    Lvl {u.level} · {u.xp} XP · {u.streak_days}🔥
                  </p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark sm:hidden">
                    Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark hidden sm:block flex-shrink-0">
                  Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                </p>
                {!u.is_admin && (
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deletingId === u.id}
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    icon={<UserX className="w-4 h-4" />}
                  >
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
