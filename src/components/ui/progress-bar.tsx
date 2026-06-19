'use client'

import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'accent' | 'danger'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = true,
  label,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const colors = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    accent: 'bg-accent-500',
    danger: 'bg-danger-500',
  }

  const bgColors = {
    primary: 'bg-primary-100 dark:bg-primary-900/30',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
    accent: 'bg-accent-100 dark:bg-accent-900/30',
    danger: 'bg-danger-100 dark:bg-danger-900/30',
  }

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${bgColors[color]} ${sizes[size]}`}>
        <div
          className={`${sizes[size]} rounded-full ${colors[color]} transition-all duration-700 ease-out ${animated ? 'animate-progress-fill' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
