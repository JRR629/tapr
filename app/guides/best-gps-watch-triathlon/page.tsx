import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Best GPS Watch for Triathlon 2025 — Tapr',
  description: 'The right GPS watch for triathlon depends on your race distance, budget, and existing gear. This guide covers what actually matters and our top picks by situation.',
}

export default function GPSWatchGuidePage() {
  return (
    <div className="min-h-screen bg-[#0A1628]" style={{ background: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 60%)' }}>
      <Nav />
      <article className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl md:text-6xl text-white leading-tight mb-4">
          The Best GPS Watch for Triathlon in 2025 — And How to Choose the Right One for You
        </h1>
        <div className="text-[#D1D5DB] text-lg leading-relaxed mb-12 border-l-2 border-[#FF6B35] pl-5">
          Most "best GPS watch" lists give you a ranking and call it a day. The problem is that the right watch for a first-time sprint triathlete on a $300 budget is completely different from the right watch for someone training for their third Ironman with a power meter and a Garmin Edge on their TT bike. This guide explains what actually matters — and at the end, shows you how to get a recommendation built around your specific situation.
        </div>

        <section>
          <h2 className="font-display text-3xl text-white mt-12 mb-4">What Makes a GPS Watch Good for Triathlon Specifically</h2>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Most sport watches can track a run. Triathlon adds complexity that eliminates most of them.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Triathlon mode and auto-transitions</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            A dedicated triathlon watch sequences swim → T1 → bike → T2 → run in a single activity, with a single button press between disciplines. Without it, you're fumbling with menus in transition while the clock runs. If you're racing any event from sprint to Ironman, this is non-negotiable.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Battery life matched to your race distance</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            A watch that dies at hour six is useless for a 70.3, let alone a full Ironman. Sprint and Olympic athletes have much more flexibility here. Full Ironman athletes should target 15+ hours in GPS mode with heart rate active — and ideally more, since a watch running at 20% battery during the marathon run is a source of real anxiety.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">GPS accuracy in the water</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Open water swimming is the hardest environment for GPS. Dual-frequency GPS (L1/L5) has become the standard for premium watches and produces meaningfully better tracks than single-frequency. If you're racing point-to-point open water swims, this matters more than a pool environment.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Power meter compatibility</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            If you use a power meter on your bike — or plan to — your watch needs ANT+ and/or Bluetooth power support. Most dedicated triathlon watches have this. The Apple Watch does not, which is a genuine dealbreaker for power-focused athletes.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Heart rate accuracy</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Wrist-based optical HR has improved substantially but still struggles in cold water and at high intensities. If you train with precise heart rate zones, understand that no wrist sensor fully replaces a chest strap — but some watches are significantly better than others.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl text-white mt-12 mb-4">Top Picks by Situation</h2>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            These aren't universal rankings. They're starting points based on common profiles.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Best overall for Ironman athletes: Garmin Forerunner 965</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            31 hours of GPS battery, dual-frequency GPS, full triathlon mode with auto-transitions, robust power meter support, and the deepest ecosystem of any triathlon watch. The AMOLED display is excellent in sunlight. At $599, it's expensive — but it's the benchmark everything else is compared against. If you're serious about long-course racing and want a watch that won't be the limiting factor on race day, this is the one.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Best value without compromise: COROS PACE 3</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            $229 and it does almost everything the Forerunner 965 does for triathlon racing. Triathlon mode, excellent GPS accuracy, 38 hours of battery, power meter support. The training platform is less polished than Garmin Connect and the smartwatch features are minimal. But if you want race-day performance without paying for lifestyle features you won't use, the PACE 3 is exceptional value.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Best for data-driven training: Polar Vantage V3</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Polar's training science is the best in the industry for athletes who take recovery and load management seriously. Running Power, Training Load Pro, and Nightly Recharge give you a level of physiological insight that Garmin approximates but doesn't match. The Vantage V3 is also the only triathlon watch with a built-in ECG. The tradeoff: Polar's ecosystem is smaller, and the watch has fewer app integrations.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">Best for navigation and adventure: Suunto Race</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            If your training involves long road rides on unfamiliar routes or trail runs, Suunto's navigation and mapping is class-leading — offline maps, up to 16GB of storage, and genuinely beautiful route visualization. The triathlon mode is solid. For athletes who race in remote or destination events, this is worth serious consideration.
          </p>

          <h3 className="text-white font-semibold text-lg mt-6 mb-2">What about Apple Watch?</h3>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Apple Watch Ultra 2 is genuinely capable for triathlon at shorter distances. The battery holds for Olympic distance with careful settings management. But it doesn't support ANT+ power meters, multi-bike profiles are manual, and the ecosystem is built around everyday life first, sport second. For Ironman or power-meter athletes, you'll feel the gaps.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl text-white mt-12 mb-4">The Variables That Change Everything</h2>
          <p className="text-[#D1D5DB] leading-relaxed mb-4">
            Here's what the generic lists don't account for:
          </p>

          <div className="text-[#D1D5DB] leading-relaxed space-y-4">
            <p>
              <strong>Your longest race distance</strong> determines the battery threshold that matters. A 70.3 athlete needs 7 hours, not 31.
            </p>
            <p>
              <strong>Your existing devices</strong> matter more than most people realize. A Garmin Edge on your bike means Garmin Connect handles all your training data in one place — switching to Polar or COROS creates sync complexity.
            </p>
            <p>
              <strong>Your budget style</strong> shapes the decision. A "best performance per dollar" athlete and a "buy once, buy right" athlete should end up with different watches even at the same budget ceiling.
            </p>
            <p>
              <strong>Multi-bike setup</strong> is a surprisingly important filter. Athletes with separate road and TT bikes need per-bike sensor profiles and calibration storage. Garmin handles this best. It's a dealbreaker-level gap on Apple Watch.
            </p>
          </div>
        </section>

        <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-8 mt-12 text-center">
          <h2 className="font-display text-4xl text-white mb-3">Get a recommendation built for you</h2>
          <p className="text-[#D1D5DB] text-sm leading-relaxed mb-6">
            The picks above are starting points. Tapr asks you 12 questions about your race goals, existing gear, and training style, then runs your answers against structured data from the reviews that actually matter. The output is a specific recommendation with a personalized explanation, not a generic ranking. Free to try. Takes 3 minutes.
          </p>
          <Link href="/signup" className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-8 py-4 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[52px] inline-flex items-center justify-center">
            Get my GPS watch recommendation →
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
      <div className="font-display text-2xl text-[#FF6B35]">TAPR</div>
      <div className="hidden sm:flex items-center gap-4">
        <Link href="/login" className="text-[#D1D5DB] hover:text-white transition-colors text-sm font-medium">
          Sign in
        </Link>
        <Link href="/signup" className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center">
          Get started free
        </Link>
      </div>
      <div className="sm:hidden">
        <Link href="/signup" className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-4 py-2 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] text-sm min-h-[44px] flex items-center">
          Get started
        </Link>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-[#1A3A5C] flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
      <div className="text-[#6B7280] text-sm">© 2025 Tapr</div>
      <div className="text-[#6B7280] text-xs text-center max-w-md">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </div>
      <div className="flex items-center gap-4 text-[#6B7280] text-sm">
        <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
      </div>
    </footer>
  )
}
