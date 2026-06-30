import Link from 'next/link'

// Trust / Methodology page (item 13). Linked as "Methodology" in marketing +
// dashboard footers and listed in the sitemap. Example sources in section 1 are
// the Tier-1 entries from review-harvester/config/sources.ts. If the source list
// changes materially, keep this page in sync.

export const metadata = {
  title: 'How Tapr Works — Our Recommendation Methodology',
  description:
    'How Tapr builds gear recommendations: real reviews from trusted sources, matched to your athlete profile, with transparent sourcing. Recommendations are never influenced by affiliate commissions.',
  alternates: { canonical: '/how-it-works' },
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A1628]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-10"
        >
          ← Back to Tapr
        </Link>

        <h1 className="font-display text-5xl text-white mb-3">HOW TAPR WORKS</h1>
        <p className="text-[#9CA3AF] text-lg leading-relaxed mb-12">
          A generic &ldquo;best gear&rdquo; list doesn&apos;t know your sport, your body, or your budget. Tapr
          does — and it grounds every recommendation in what real reviewers actually found. Here&apos;s exactly
          how.
        </p>

        <div className="prose prose-invert max-w-none space-y-10 text-[#D1D5DB] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl text-white mb-3">1. WE START WITH REAL REVIEWS</h2>
            <p>
              Every recommendation synthesizes real reviews from sources serious endurance athletes trust —
              specialist publications, expert long-form reviewers, verified buyer reviews from major retailers,
              and trusted video reviewers. We read what reviewers actually said when they tested a product, score
              it across the dimensions that matter for that category, and build from there.
            </p>
            <p className="mt-3">
              The exact sources depend on the category. Examples of the kind of trusted reviewers we draw from:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><span className="text-white font-semibold">Wetsuits</span> — DC Rainmaker, 220 Triathlon, Slowtwitch, Outdoor Swimmer</li>
              <li><span className="text-white font-semibold">GPS watches</span> — DC Rainmaker, Triathlete Magazine, Tom&apos;s Guide, 220 Triathlon</li>
              <li><span className="text-white font-semibold">Running shoes</span> — RunRepeat, Doctors of Running, Believe in the Run, Road Trail Run</li>
              <li><span className="text-white font-semibold">Nutrition</span> — 220 Triathlon, Triathlete Magazine, Outside Online, Runner&apos;s World</li>
            </ul>
            <p className="mt-4">
              The key word is <span className="text-white font-semibold">synthesize</span>. Tapr does not invent
              opinions or fabricate scores. If the evidence for a product is thin, we tell you the confidence is
              lower rather than pretending to certainty.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">2. WE MATCH IT TO YOU</h2>
            <p>
              Generic advice ignores who you are. Tapr collects your sport, race distances, experience level,
              height and weight, known fit issues, existing gear, and budget — then filters every recommendation
              through those specifics. A 5&apos;4&quot; beginner doing her first sprint triathlon gets different
              advice than a 6&apos;2&quot; veteran targeting a full Ironman. The questions each category asks are
              the ones that actually change the answer.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">3. WE SHOW OUR WORK</h2>
            <p>
              Every recommendation names the sources it drew from and explains why a product fits{' '}
              <span className="text-white font-semibold">your</span> profile specifically — not just why it&apos;s
              generally good. When sources disagree, we say so. When confidence is lower, we say so. You can click
              through to the original sources and judge for yourself.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">WHO BUILT THIS</h2>
            <p>
              Tapr was built by an age-group triathlete, not a gear journalist. The recommendations don&apos;t
              reflect one person&apos;s opinion — they reflect what the sport&apos;s most trusted reviewers found,
              matched to your specific profile.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">HOW WE MAKE MONEY</h2>
            <p>
              Tapr earns an affiliate commission when you buy gear through our links. We also offer paid credit
              packs for additional recommendations beyond your free credits. Neither one influences which products
              we recommend — recommendations are built from review data and your profile, before any commission is
              considered. Every recommendation cites its sources so you can verify the reasoning yourself.
            </p>
            <p className="mt-3 text-[#6B7280] text-sm">
              See our{' '}
              <Link href="/privacy" className="text-[#FF6B35] hover:underline">Privacy Policy</Link> and{' '}
              <Link href="/terms" className="text-[#FF6B35] hover:underline">Terms</Link> for the full detail.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
