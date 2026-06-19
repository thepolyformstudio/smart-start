'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import {
  MessageSquareHeart, Bug, Lightbulb, Star, Smile,
  CheckCircle2, ChevronRight, Clock
} from 'lucide-react'
import { format } from 'date-fns'

type FeedbackType = 'general' | 'bug' | 'feature' | 'praise'

interface PastFeedback {
  id: string
  type: FeedbackType
  rating: number | null
  message: string
  created_at: string
}

const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { value: 'general', label: 'General', icon: <MessageSquareHeart className="w-5 h-5" />, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'bug', label: 'Bug Report', icon: <Bug className="w-5 h-5" />, color: 'text-danger-500', bg: 'bg-danger-100 dark:bg-danger-900/30' },
  { value: 'feature', label: 'Feature Request', icon: <Lightbulb className="w-5 h-5" />, color: 'text-accent-500', bg: 'bg-accent-100 dark:bg-accent-900/30' },
  { value: 'praise', label: 'Praise 🎉', icon: <Smile className="w-5 h-5" />, color: 'text-secondary-500', bg: 'bg-secondary-100 dark:bg-secondary-900/30' },
]

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pastFeedback, setPastFeedback] = useState<PastFeedback[]>([])
  const [type, setType] = useState<FeedbackType>('general')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState('')
  const { success, error: showError } = useToast()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setPastFeedback(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async () => {
    if (!message.trim()) { showError('Please write your feedback before submitting.'); return }
    if (message.trim().length < 10) { showError('Please provide a bit more detail (at least 10 characters).'); return }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showError('You must be logged in to submit feedback.'); setSubmitting(false); return }

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type,
      rating: rating > 0 ? rating : null,
      message: message.trim(),
    })

    if (error) {
      showError('Failed to submit feedback. Please try again.')
      setSubmitting(false)
      return
    }

    success('Thank you! Your feedback has been submitted.')
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return <PageLoader />

  const typeInfo = (t: FeedbackType) => feedbackTypes.find(f => f.value === t)!

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-bounce-in space-y-6 text-center">
        <div className="w-24 h-24 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center animate-pulse-glow">
          <CheckCircle2 className="w-12 h-12 text-secondary-500" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-2">
            Feedback Sent!
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-md">
            Thank you for helping us make Smart Start better. Your voice matters and we review every single submission.
          </p>
        </div>
        <Button onClick={() => { setSubmitted(false); setMessage(''); setRating(0); setType('general') }}>
          Submit Another Response
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 bg-gradient-to-r from-secondary-500 to-primary-500 shadow-2xl shadow-secondary-500/20">
        <div className="absolute inset-0 bg-white/5 shimmer"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight drop-shadow-md">Give Feedback</h1>
              <p className="text-white/80 text-sm font-medium">Help us shape the future of Smart Start</p>
            </div>
          </div>
          <p className="text-white/90 mt-4 leading-relaxed">
            Your insights are invaluable. Whether it's a bug, a brilliant idea, or just a kind word — we'd love to hear from you. Every submission goes directly to the Dareal team.
          </p>
        </div>
      </div>

      {/* Feedback Form */}
      <Card padding="lg" className="space-y-6">
        {/* Type Selector */}
        <div>
          <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            What kind of feedback is this?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {feedbackTypes.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setType(ft.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 font-medium text-sm ${
                  type === ft.value
                    ? `${ft.bg} ${ft.color} border-current shadow-md scale-105`
                    : 'border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-primary-300 hover:scale-105 bg-surface-elevated-light dark:bg-surface-elevated-dark'
                }`}
              >
                <span className={type === ft.value ? ft.color : ''}>{ft.icon}</span>
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            Overall Experience <span className="text-text-muted-light dark:text-text-muted-dark font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="cursor-pointer transition-transform hover:scale-125 active:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors duration-150 ${
                    star <= (hoveredRating || rating)
                      ? 'text-accent-400 fill-accent-400'
                      : 'text-border-light dark:text-border-dark'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
              {['', 'Very Poor', 'Poor', 'Okay', 'Great', 'Excellent!'][rating]}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Your Message <span className="text-danger-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug' ? "Describe what happened, and steps to reproduce it..." :
              type === 'feature' ? "Describe the feature you'd love to see..." :
              type === 'praise' ? "Tell us what you love! 🎉" :
              "Share your thoughts with us..."
            }
            rows={5}
            className="w-full px-4 py-3 rounded-2xl border-2 border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark text-text-primary-light dark:text-text-primary-dark text-sm resize-none transition-all focus:outline-none focus:border-primary-400 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark leading-relaxed"
          />
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1.5 text-right">
            {message.length} characters
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          isLoading={submitting}
          className="w-full text-base py-3 animate-pulse-glow"
          icon={<ChevronRight className="w-5 h-5" />}
        >
          Submit Feedback
        </Button>
      </Card>

      {/* Past Submissions */}
      {pastFeedback.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-500" />
            Your Past Submissions
          </h3>
          <div className="space-y-3">
            {pastFeedback.map((fb) => {
              const ti = typeInfo(fb.type)
              return (
                <div
                  key={fb.id}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-border-light dark:border-border-dark"
                >
                  <div className={`p-2 rounded-xl ${ti.bg} ${ti.color} mt-0.5`}>
                    {ti.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${ti.color}`}>{ti.label}</span>
                      {fb.rating && (
                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-accent-400 text-accent-400" />
                          {fb.rating}/5
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary-light dark:text-text-primary-dark line-clamp-2 leading-relaxed">
                      {fb.message}
                    </p>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                      {format(new Date(fb.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
