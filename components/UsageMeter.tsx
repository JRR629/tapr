'use client'

interface UsageMeterProps {
  used: number
  limit: number | null
}

export function UsageMeter({ used, limit }: UsageMeterProps) {
  if (limit === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[#22C55E] text-sm font-semibold font-mono">Unlimited</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[#6B7280] text-sm font-mono">{used}/{limit}</span>
      <div className="flex gap-1">
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-sm transition-colors ${i < used ? 'bg-[#FF6B35]' : 'bg-[#1A3A5C]'}`}
          />
        ))}
      </div>
    </div>
  )
}
