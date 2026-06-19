import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
}

export function Card({
  children,
  className = '',
  hover = true,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  }

  const variants = {
    default: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm',
    glass: 'glass-card',
    elevated: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-lg shadow-primary-500/5',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl shadow-lg shadow-primary-500/30',
  }

  return (
    <div
      className={`
        ${variants[variant]}
        ${paddings[padding]}
        ${hover && variant !== 'gradient' ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300' : 'transition-all duration-300'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-bold text-text-primary-light dark:text-text-primary-dark ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 ${className}`}>
      {children}
    </p>
  )
}
