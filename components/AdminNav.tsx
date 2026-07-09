import Link from 'next/link'

// Shared admin sub-navigation. Rendered at the top of each /admin/* page so the
// three admin surfaces are reachable from one another.
const LINKS = [
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/recommendations', label: 'Recommendations' },
  { href: '/admin/feedback', label: 'Feedback' },
]

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="flex items-center gap-2 mb-8 flex-wrap">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm font-semibold px-3 py-2 rounded-md min-h-[44px] inline-flex items-center transition-colors ${
            active === l.href
              ? 'bg-[#FF6B35] text-white'
              : 'border border-[#1A3A5C] text-[#D1D5DB] hover:border-[#FF6B35] hover:text-white'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
