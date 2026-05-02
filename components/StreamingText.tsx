'use client'

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
}

export function StreamingText({ text, isStreaming = false }: StreamingTextProps) {
  return (
    <div className="text-[#D1D5DB] leading-relaxed whitespace-pre-wrap">
      {text}
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-4 bg-[#FF6B35] ml-0.5 align-middle"
          style={{ animation: 'tapr-blink 1s step-start infinite' }}
        />
      )}
    </div>
  )
}
