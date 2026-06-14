'use client'

import { useState, useEffect } from 'react'

interface LoadingProgressProps {
  messages: string[]
  isComplete?: boolean
  label?: string
  streamProgress?: number
}

export function LoadingProgress({
  messages,
  isComplete = false,
  label,
}: LoadingProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (isComplete || messages.length === 0) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isComplete, messages.length])

  return (
    <div className="flex flex-col gap-4 w-full">
      {label && (
        <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">
          {label}
        </p>
      )}

      <div className="relative w-full h-1.5 bg-[#1A3A5C] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent animate-tapr-shimmer"
          aria-hidden
        />
      </div>

      <p
        key={messageIndex}
        className="text-[#D1D5DB] text-sm text-center transition-opacity duration-500"
      >
        {messages[messageIndex]}
      </p>
    </div>
  )
}
