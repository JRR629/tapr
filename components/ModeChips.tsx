import Link from 'next/link'

interface ModeChipsProps {
  categorySlug: string
  active: 'recommend' | 'compare'
}

export function ModeChips({ categorySlug, active }: ModeChipsProps) {
  const chipBase = 'px-4 py-1.5 rounded text-sm font-medium transition-colors'
  const activeChip = `${chipBase} bg-[#FF6B35] text-white`
  const inactiveChip = `${chipBase} text-[#9CA3AF] hover:text-white`
  return (
    <div className="inline-flex gap-1 p-1 bg-[#0F2040] border border-[#1A3A5C] rounded-md">
      <Link href={`/gear/${categorySlug}`} className={active === 'recommend' ? activeChip : inactiveChip}>
        Recommend
      </Link>
      <Link href={`/gear/${categorySlug}/compare`} className={active === 'compare' ? activeChip : inactiveChip}>
        Compare
      </Link>
    </div>
  )
}
