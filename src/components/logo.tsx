import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-3xl' },
  }

  const s = sizes[size]

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="100%" stopColor="#00B894" />
            </linearGradient>
            <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F0F0FF" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logoGrad)" />
          {/* S letter */}
          <path
            d="M30.5 17.5C30.5 17.5 28.5 13 24 13C19.5 13 17 15.5 17 18.5C17 25 31 22 31 28.5C31 31.5 28 35 23.5 35C19 35 17 31 17 31"
            stroke="url(#letterGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Star accent */}
          <circle cx="35" cy="10" r="3" fill="#FDCB6E" className="animate-pulse" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight leading-tight ${s.text} gradient-text`}>
            Smart Start
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] font-medium text-text-muted-light dark:text-text-muted-dark tracking-widest uppercase">
              Study Companion
            </span>
          )}
        </div>
      )}
    </div>
  )
}
