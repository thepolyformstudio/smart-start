import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  BookOpen, Target, Flame, Clock, Brain, BarChart3,
  CheckCircle, Star, ArrowRight, Zap, Calendar, Award
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-400/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-bounce-in">
              <Zap className="w-4 h-4" />
              Your Personal Study Companion
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
              <span className="gradient-text">Study Smarter</span>
              <br />
              <span className="text-text-primary-light dark:text-text-primary-dark">Every Single Day</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Plan your study hours, track progress across subjects, follow spaced revision schedules,
              and build winning study habits — all in one beautiful app.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/register">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Start Free Today
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  See Features
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text">100%</div>
                <div className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Free to Use</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text">PWA</div>
                <div className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Install & Use</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold gradient-text">∞</div>
                <div className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Subjects</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto">
              Smart Start is packed with features designed to help you study effectively and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <BookOpen className="w-6 h-6" />, title: 'Subject Management', desc: 'Organize subjects, chapters, and topics with full CRUD and progress tracking.', color: 'primary' },
              { icon: <Calendar className="w-6 h-6" />, title: 'Smart Study Planner', desc: 'Auto-generated daily study plans based on your schedule and priorities.', color: 'secondary' },
              { icon: <Clock className="w-6 h-6" />, title: 'Pomodoro Timer', desc: 'Built-in Pomodoro and stopwatch timers to keep you focused.', color: 'accent' },
              { icon: <Brain className="w-6 h-6" />, title: 'Spaced Revision', desc: 'Automatic revision schedules using proven spaced repetition techniques.', color: 'primary' },
              { icon: <Target className="w-6 h-6" />, title: 'Exam Tracking', desc: 'Track upcoming exams with countdowns, scores, and target goals.', color: 'danger' },
              { icon: <Flame className="w-6 h-6" />, title: 'Streaks & XP', desc: 'Build study streaks, earn XP, level up, and unlock achievements.', color: 'accent' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Rich Analytics', desc: 'Daily, weekly, and long-term progress charts and insights.', color: 'secondary' },
              { icon: <CheckCircle className="w-6 h-6" />, title: 'Mistake Log', desc: 'Track mistakes, understand reasons, and review corrections.', color: 'danger' },
              { icon: <Award className="w-6 h-6" />, title: 'Achievements', desc: 'Unlock achievements for milestones and stay motivated.', color: 'primary' },
            ].map((feature, i) => {
              const colorMap = {
                primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
                accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400',
                danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
              }
              return (
                <div
                  key={i}
                  className="glass-card p-6 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${colorMap[feature.color as keyof typeof colorMap]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary-light dark:text-text-primary-dark mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Get started in minutes, see results in days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your free account in seconds', icon: '🚀' },
              { step: '02', title: 'Set Up', desc: 'Add your subjects, topics, and schedule', icon: '📚' },
              { step: '03', title: 'Study', desc: 'Follow your personalized daily plan', icon: '🎯' },
              { step: '04', title: 'Achieve', desc: 'Track progress and ace your exams', icon: '🏆' },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {item.desc}
                </p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-text-muted-light dark:text-text-muted-dark">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg-animated opacity-90" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Study Smarter?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join Smart Start today and transform the way you learn.
          </p>
          <Link href="/register">
            <Button variant="accent" size="lg" icon={<Star className="w-5 h-5" />}>
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              © {new Date().getFullYear()} Smart Start. Plan. Learn. Achieve.
            </p>
            <div className="flex gap-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              <Link href="/login" className="hover:text-primary-500 transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-primary-500 transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
