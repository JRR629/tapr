'use client'

import { useState, useEffect } from 'react'

interface LoadingProgressProps {
  messages: string[]
  isComplete?: boolean
  label?: string
  // Real progress signal: characters received / expected total characters (0–1).
  // When provided and > 0, drives the bar from 15% → 97% based on actual token throughput.
  // When 0 (waiting for first token), the bar slowly warms up from 0 → 15%.
  streamProgress?: number
}

export function LoadingProgress({
  messages,
  isComplete = false,
  label,
  streamProgress = 0,
}: LoadingProgressProps) {
  const [warmup, setWarmup] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  // Warmup: smoothly advance 0→15% before first token arrives
  useEffect(() => {
    if (isComplete || streamProgress > 0) return
    const interval = setInterval(() => {
      setWarmup((prev) => Math.min(prev + 0.3, 15))
    }, 100)
    return () => clearInterval(interval)
  }, [isComplete, streamProgress])

  // Cycle messages every 3s
  useEffect(() => {
    if (isComplete || messages.length === 0) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isComplete, messages.length])

  let display: number
  if (isComplete) {
    display = 100
  } else if (streamProgress > 0) {
    // streamProgress is NOT capped at 1 — responses longer than expected
    // keep pushing past 97% toward 99%, eliminating the stall at the ceiling
    display = Math.min(15 + streamProgress * 82, 99)
  } else {
    display = warmup
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">
          {label}
        </p>
      )}

      <div className="w-full h-1.5 bg-[#1A3A5C] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF6B35] rounded-full transition-all duration-300"
          style={{ width: `${display}%` }}
        />
      </div>

      <p
        key={messageIndex}
        className="text-[#D1D5DB] text-sm text-center transition-opacity duration-500"
      >
        {messages[messageIndex]}
      </p>

      <p className="text-[#6B7280] text-xs text-center">
        {Math.round(display)}%
      </p>
    </div>
  )
}
