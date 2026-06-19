'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShow(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 200)
  }

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`
          relative w-full ${sizes[size]}
          bg-surface-light dark:bg-surface-dark
          rounded-2xl shadow-2xl
          border border-border-light dark:border-border-dark
          transition-all duration-200
          ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          max-h-[90vh] overflow-y-auto
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-border-light dark:border-border-dark">
            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-text-muted-light dark:text-text-muted-dark transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={title ? 'p-5' : 'p-5'}>
          {children}
        </div>
      </div>
    </div>
  )
}
