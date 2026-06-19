'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useTheme } from '@/components/theme-provider'
import { PageLoader } from '@/components/ui/loading'
import { Settings, User, Moon, Sun, Download, Bell, BellRing, BellOff } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [classYear, setClassYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [reminderTime, setReminderTime] = useState('19:00')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { success, error: showError } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('name, age, class_year').eq('id', user.id).single()
      if (data) { setName(data.name || ''); setAge(data.age?.toString() || ''); setClassYear(data.class_year || '') }
      setLoading(false)
    }
    fetchProfile()

    // Load notification settings
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
    const storedReminder = localStorage.getItem('smart-start-reminder-time')
    if (storedReminder) setReminderTime(storedReminder)
    setReminderEnabled(localStorage.getItem('smart-start-reminder-enabled') === 'true')
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      name, age: age ? parseInt(age) : null, class_year: classYear || null,
    }).eq('id', user.id)
    setSaving(false)
    success('Profile updated!')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setExporting(false); return }

      // Fetch all data in parallel
      const [profileRes, subjectsRes, sessionsRes, topicsRes, revisionRes] = await Promise.all([
        supabase.from('profiles').select('name, xp, level, streak_days, class_year').eq('id', user.id).single(),
        supabase.from('subjects').select('name, color, chapters(name, topics(name, status, confidence))').eq('user_id', user.id),
        supabase.from('study_sessions').select('duration_minutes, session_type, started_at').eq('user_id', user.id),
        supabase.from('topics').select('status').eq('user_id', user.id),
        supabase.from('revision_schedule').select('status').eq('user_id', user.id),
      ])

      const profile = profileRes.data
      const subjects = (subjectsRes.data || []) as { name: string; color: string; chapters: { name: string; topics: { name: string; status: string; confidence: number }[] }[] }[]
      const sessions = sessionsRes.data || []
      const topics = topicsRes.data || []
      const revisions = revisionRes.data || []

      const totalMinutes = sessions.reduce((s, sess) => s + sess.duration_minutes, 0)
      const completedTopics = topics.filter(t => t.status === 'completed').length
      const completedRevisions = revisions.filter(r => r.status === 'completed').length

      // Build PDF
      const doc = new jsPDF()

      // Header
      doc.setFillColor(108, 92, 231)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Smart Start — Study Report', 14, 20)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30)

      // Profile section
      doc.setTextColor(45, 52, 54)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Profile', 14, 55)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const profileInfo = [
        `Name: ${profile?.name || 'N/A'}`,
        `Class/Year: ${profile?.class_year || 'N/A'}`,
        `Level: ${profile?.level || 1}  |  XP: ${profile?.xp || 0}  |  Streak: ${profile?.streak_days || 0} days`,
      ]
      profileInfo.forEach((line, i) => doc.text(line, 14, 63 + i * 7))

      // Overview stats
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Overview', 14, 92)

      autoTable(doc, {
        startY: 97,
        head: [['Metric', 'Value']],
        body: [
          ['Total Study Hours', `${Math.round(totalMinutes / 60 * 10) / 10}h`],
          ['Total Sessions', `${sessions.length}`],
          ['Topics Completed', `${completedTopics} / ${topics.length}`],
          ['Completion Rate', `${topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0}%`],
          ['Revisions Completed', `${completedRevisions} / ${revisions.length}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [108, 92, 231], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 254] },
      })

      // Subject progress table
      if (subjects.length > 0) {
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 140

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Subject Progress', 14, finalY + 15)

        const subjectRows = subjects.map(s => {
          const allTopics = s.chapters?.flatMap(c => c.topics || []) || []
          const done = allTopics.filter(t => t.status === 'completed').length
          const total = allTopics.length
          const avgConf = allTopics.length > 0
            ? (allTopics.reduce((sum, t) => sum + t.confidence, 0) / allTopics.length).toFixed(1)
            : 'N/A'
          return [
            s.name,
            `${s.chapters?.length || 0}`,
            `${done} / ${total}`,
            `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
            `${avgConf}/5`,
          ]
        })

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Subject', 'Chapters', 'Topics', 'Progress', 'Avg Confidence']],
          body: subjectRows,
          theme: 'grid',
          headStyles: { fillColor: [0, 184, 148], textColor: 255 },
          alternateRowStyles: { fillColor: [230, 255, 247] },
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(160, 168, 180)
        doc.text(`Smart Start — Page ${i} of ${pageCount}`, 14, 287)
        doc.text('Plan. Learn. Achieve.', 196, 287, { align: 'right' })
      }

      doc.save(`SmartStart_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      success('PDF report downloaded! 📄')
    } catch {
      showError('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      showError('Your browser does not support notifications')
      return
    }
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') {
      success('Notifications enabled! 🔔')
      new Notification('Smart Start', { body: 'You will now receive study reminders!', icon: '/icons/icon-192x192.png' })
    } else {
      showError('Notification permission denied')
    }
  }

  const toggleReminder = () => {
    const newState = !reminderEnabled
    setReminderEnabled(newState)
    localStorage.setItem('smart-start-reminder-enabled', String(newState))
    if (newState) {
      success(`Study reminder set for ${reminderTime} daily`)
    } else {
      success('Study reminder disabled')
    }
  }

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time)
    localStorage.setItem('smart-start-reminder-time', time)
    if (reminderEnabled) {
      success(`Reminder updated to ${time}`)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-500" /> Settings
        </h1>
      </div>

      {/* Profile Settings */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary-500" /> Profile
        </h3>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          <Input label="Class / Year" value={classYear} onChange={(e) => setClassYear(e.target.value)} />
          <Button onClick={handleSave} isLoading={saving}>Save Changes</Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-primary-500" /> : <Sun className="w-5 h-5 text-accent-500" />} Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary-light dark:text-text-primary-dark">Dark Mode</p>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Toggle dark/light theme</p>
          </div>
          <button onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'bg-primary-500' : 'bg-border-light'}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-accent-500" /> Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary-light dark:text-text-primary-dark">Browser Notifications</p>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                {notifPermission === 'granted' ? 'Enabled — you will receive alerts' :
                 notifPermission === 'denied' ? 'Blocked — enable in browser settings' :
                 'Allow notifications for study reminders'}
              </p>
            </div>
            {notifPermission === 'granted' ? (
              <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-secondary-500" />
              </div>
            ) : notifPermission === 'denied' ? (
              <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <BellOff className="w-5 h-5 text-danger-500" />
              </div>
            ) : (
              <Button size="sm" onClick={requestNotifPermission}>Enable</Button>
            )}
          </div>

          {notifPermission === 'granted' && (
            <div className="p-4 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Daily Study Reminder</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Get notified to start studying</p>
                </div>
                <button onClick={toggleReminder}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${reminderEnabled ? 'bg-primary-500' : 'bg-border-light dark:bg-border-dark'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {reminderEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Remind me at</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Export */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-secondary-500" /> Export Data
        </h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
          Download your study progress as a PDF report including profile, subject progress, study hours, and revision stats.
        </p>
        <Button variant="outline" onClick={handleExport} isLoading={exporting} icon={<Download className="w-4 h-4" />}>
          Export PDF Report
        </Button>
      </Card>
    </div>
  )
}
