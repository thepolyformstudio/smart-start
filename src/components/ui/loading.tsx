import React from 'react'

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4 text-primary-500" />
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        bg-border-light dark:bg-border-dark rounded-lg
        overflow-hidden relative
        ${className}
      `}
    >
      <div className="shimmer absolute inset-0" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-3" />
      <Skeleton className="h-2 w-full" />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 text-primary-500">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-md mb-6">
        {description}
      </p>
      {action}
    </div>
  )
}
