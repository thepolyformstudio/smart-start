import React from 'react'
import { Card } from '@/components/ui/card'
import { Heart, Rocket, Target, Sparkles, Code2, Users, Lightbulb } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] p-10 md:p-14 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 shadow-2xl shadow-primary-500/20 text-center">
        <div className="absolute inset-0 bg-white/5 shimmer"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
            <Rocket className="w-10 h-10 text-white animate-float" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
            About Smart Start
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-sm max-w-2xl mx-auto leading-relaxed">
            Revolutionizing the way you study. We combine beautiful design with powerful gamification to make learning addictive and rewarding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Our Mission */}
        <Card variant="glass" padding="lg" className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <Target className="w-8 h-8 text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            Our Mission
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            Studying doesn't have to be a chore. Our mission is to transform the educational experience from something students <i>have</i> to do, into something they <i>want</i> to do. By introducing structured progression, rewarding streaks, and dynamic visual feedback, we help students stay focused and motivated.
          </p>
        </Card>

        {/* Why Smart Start? */}
        <Card variant="glass" padding="lg" className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <Sparkles className="w-8 h-8 text-accent-500 mb-4" />
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            Why Smart Start?
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
            Traditional planners are static and easily forgotten. Smart Start acts as your interactive companion. It automatically structures your revision schedules, tracks your mistakes so you never repeat them, and celebrates every single milestone you hit along the way.
          </p>
        </Card>
      </div>

      {/* Origin Story */}
      <Card variant="gradient" className="relative overflow-hidden p-8 sm:p-10">
        <div className="absolute inset-0 bg-white/5 shimmer"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-white mb-4 drop-shadow-sm">
                The Story Behind Smart Start
              </h2>
              <div className="space-y-4 text-white/90 leading-relaxed text-lg">
                <p>
                  Smart Start is proudly built by <strong>Dareal</strong>. The company was founded by <strong>Elizebeth Deepu</strong>, who recognized a critical gap in the tools available to modern students. 
                </p>
                <p>
                  She felt a deep need for an intelligent planner—one that didn't just passively list tasks, but actively monitored and tracked a student's progress. Elizebeth envisioned a platform that could seamlessly adapt to a student's unique study patterns and keep them genuinely motivated. That vision became the foundation of Dareal, and ultimately, the birth of Smart Start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Core Values / Features */}
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Our Core Pillars
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-14 h-14 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Lightbulb className="w-7 h-7 text-primary-500" />
            </div>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Smart Organization</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Categorize subjects, map out topics, and visually track your mastery in real-time.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-14 h-14 mx-auto bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Code2 className="w-7 h-7 text-secondary-500" />
            </div>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Algorithm Driven</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Our daily planner automatically figures out exactly what you should study today.</p>
          </div>
          <div className="text-center p-4">
            <div className="w-14 h-14 mx-auto bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-accent-500" />
            </div>
            <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">Built for Students</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Designed meticulously with the modern student in mind. Simple, fast, and beautiful.</p>
          </div>
        </div>
      </Card>

      {/* Footer message */}
      <div className="text-center pb-8 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-full border border-border-light dark:border-border-dark text-sm text-text-secondary-light dark:text-text-secondary-dark shadow-sm">
          Built with <Heart className="w-4 h-4 text-danger-500 animate-pulse" /> by the Smart Start Team
        </div>
      </div>
    </div>
  )
}
