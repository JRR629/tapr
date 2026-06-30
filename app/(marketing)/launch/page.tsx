import Image from 'next/image'
import Link from 'next/link'
import { Waves, Watch, Eye, Shirt, Footprints, Zap, Bike, Package } from 'lucide-react'

export default function LaunchPage() {
  return (
    <div
      className="min-h-screen bg-[#0A1628]"
      style={{ background: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 60%)' }}
    >
      <Nav />
      <Hero />
      <MockRecommendation />
      <HowItWorks />
      <LaunchCategories />
      <WhyTapr />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <Image
        src="/logo-sidebar.svg"
        alt="Tapr"
        width={200}
        height={103}
        priority
      />
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-6 py-3 rounded-md transition-colors min-h-[44px] flex items-center text-sm font-semibold"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center text-sm"
        >
          Get started free
        </Link>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14 md:py-20 text-center">
      <div className="inline-flex items-center gap-2 bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
        Wetsuits · GPS Watches · Running Shoes · Nutrition · Now live
      </div>
      <h1 className="font-display text-6xl md:text-8xl text-white leading-none mb-6">
        Gear that fits your race.
        <br />
        Not someone else&apos;s.
      </h1>
      <p className="text-[#D1D5DB] text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
        Tapr asks the questions that matter, runs your answers against expert reviews, and tells you exactly what to buy — and why it&apos;s right for your sport and body.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
        <Link
          href="/signup"
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center text-base"
        >
          Start for free →
        </Link>
        <a
          href="#how-it-works"
          className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-8 py-3 rounded-md transition-colors min-h-[44px] flex items-center text-base font-semibold"
        >
          See how it works
        </a>
      </div>
      <p className="text-[#6B7280] text-sm">
        3 free credits · No credit card required · 4-minute setup
      </p>
    </section>
  )
}

function MockRecommendation() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-2">
        What a Tapr recommendation looks like
      </div>
      <p className="text-[#6B7280] text-sm text-center mb-6">
        Based on a real athlete profile — 6&apos;1&quot; / 185 lbs, Ironman-distance, history of shoulder restriction mid-stroke, $400 budget
      </p>
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg overflow-hidden shadow-[0_0_60px_rgba(255,107,53,0.12)]">
        <div className="p-6 md:p-8 border-b border-[#1A3A5C]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide inline-block mb-3">
                Top Pick
              </span>
              <h3 className="font-display text-3xl text-white leading-tight">
                Orca Apex Flex
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-xl text-[#FF6B35]">$385</span>
            </div>
          </div>
          <p className="text-[#D1D5DB] leading-relaxed mb-5">
            At 6&apos;1&quot; / 185 lbs with your shoulder restriction history, the Apex Flex is the right call — Orca&apos;s Flex panels run significantly wider through the shoulder than the Endure or most Blueseventy suits at this price, and multiple reviewers with freestyle shoulder issues specifically flag it as the suit they stopped noticing mid-swim. At Ironman distance that matters more than buoyancy optimization.
          </p>
          <ul className="flex flex-col gap-2 mb-5">
            {[
              'Wider shoulder panel — built for freestyle range of motion, not just speed',
              'Hits your $400 budget with room to spare for race-day accessories',
              'Neoprene grade holds up across a full Ironman season of open-water training',
            ].map((strength) => (
              <li key={strength} className="flex items-start gap-2 text-sm text-[#D1D5DB]">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#FF6B35] shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
          <p className="text-[#6B7280] text-sm italic">
            Sizing runs slightly slim through the torso — if you carry weight through the midsection, size up from the chart.
          </p>
        </div>
        <div className="px-6 md:px-8 py-5 bg-[#0A1628]/40">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="bg-[#1A3A5C] text-[#D1D5DB] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide inline-block mb-2">
                Runner-Up
              </span>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl text-white">Blueseventy Pursuit</span>
                <span className="font-mono text-sm text-[#6B7280]">$379</span>
              </div>
            </div>
          </div>
          <p className="text-[#6B7280] text-sm mt-2">
            Consider this if: Your shoulder restriction has resolved and you want to prioritize buoyancy over fit flexibility.
          </p>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Build your profile',
      body: 'Tell us your sport, race distances, experience, budget, and existing gear. Takes 4 minutes. This is the context generic advice never has.',
    },
    {
      number: '02',
      title: 'Answer a few questions',
      body: "Each gear category has 10–12 questions that surface what actually differentiates the right product — things most athletes don't know to ask about.",
    },
    {
      number: '03',
      title: 'Get a specific answer',
      body: 'Not a list. Not "it depends." A top pick, a runner-up, and an honest explanation grounded in real reviews from sources serious athletes trust.',
    },
  ]

  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        How it works
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-10">
        A specific answer in 3 minutes.
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div
            key={step.number}
            className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
          >
            <div className="font-display text-5xl text-[#FF6B3530] mb-3">{step.number}</div>
            <h3 className="font-display text-2xl text-white mb-2">{step.title}</h3>
            <p className="text-[#D1D5DB] leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LaunchCategories() {
  const active = [
    { label: 'Wetsuits', Icon: Waves },
    { label: 'GPS Watches', Icon: Watch },
    { label: 'Running Shoes', Icon: Footprints },
    { label: 'Nutrition', Icon: Zap },
  ]

  const coming = [
    { label: 'Goggles', Icon: Eye },
    { label: 'Tri Suits', Icon: Shirt },
    { label: 'Bikes', Icon: Bike },
    { label: 'Accessories', Icon: Package },
  ]

  return (
    <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        Available now
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-10">
        Four categories. Fully launched.
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {active.map(({ label, Icon }) => (
          <div
            key={label}
            className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 flex flex-col items-center gap-3 hover:-translate-y-1 hover:border-[#FF6B35] hover:shadow-lg hover:shadow-black/20 transition-all duration-200 cursor-pointer"
          >
            <Icon className="w-7 h-7 text-[#FF6B35]" />
            <span className="font-semibold text-white text-sm text-center">{label}</span>
          </div>
        ))}
        {coming.map(({ label, Icon }) => (
          <div
            key={label}
            className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-6 flex flex-col items-center gap-3 opacity-60"
          >
            <Icon className="w-7 h-7 text-[#6B7280]" />
            <span className="font-semibold text-[#6B7280] text-sm text-center">{label}</span>
            <span className="bg-[#1A3A5C] text-[#6B7280] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function WhyTapr() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        Why Tapr
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-10">
        Three ways people research gear.
        <br />
        Here&apos;s what each one gets you.
      </h2>
      <div className="flex flex-col gap-6">
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
          <h3 className="font-display text-3xl text-white mb-3">Google it</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            You&apos;ll find lists. &ldquo;Best running shoes 2025&rdquo; or &ldquo;Best triathlon wetsuits.&rdquo; They&apos;re written by publications that reviewed a handful of options, sometimes by writers who don&apos;t compete in your sport. The top result is whoever has the best SEO, not whoever has the best answer. The recommendations don&apos;t know your sport, your budget, or your fit history. You&apos;ll read four articles that broadly agree on the top pick, feel mildly confident, and still wonder if you missed something.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
          <h3 className="font-display text-3xl text-white mb-3">Ask an AI</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            Getting better. A frontier model like ChatGPT or Gemini will give you a coherent, well-structured answer — and if you&apos;re a sophisticated prompter who includes your race distance, budget, existing devices, and training goals, you&apos;ll get something reasonably useful. The problem is threefold: you have to know what context to include, the model can&apos;t verify its claims against current review data, and there&apos;s no accountability for whether the recommendation was actually right for you. You&apos;ll also get a different answer next week because the model changed.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-7 shadow-[0_0_40px_rgba(255,107,53,0.08)] hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(255,107,53,0.14)] transition-all duration-200">
          <h3 className="font-display text-3xl text-[#FF6B35] mb-3">Tapr</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            Your profile is already there — including your sport and discipline. The right questions get asked automatically — including ones you wouldn&apos;t think to include in a chat prompt, like whether you train with a power meter, your current equipment, and your body&apos;s specific fit needs. Every recommendation is grounded in structured data from the reviews that serious athletes actually trust, with scores that reflect what reviewers found when they tested the product. The output is a specific answer with a specific explanation for your specific situation. And it takes three minutes.
          </p>
        </div>
      </div>
      <p className="text-[#D1D5DB] text-center text-base md:text-lg italic mt-10 max-w-2xl mx-auto leading-relaxed">
        The right gear decision isn&apos;t about finding more information. It&apos;s about filtering the right information for you. That&apos;s what Tapr is built to do.
      </p>
    </section>
  )
}

function Pricing() {
  const creditMath = [
    '1 recommendation = 1 credit',
    '2-product comparison = 1 credit',
    '3–4 product comparison = 2 credits',
  ]

  const packs = [
    { label: '3 credits', price: '$2.99', sub: 'One more round of recs' },
    { label: '10 credits', price: '$8.99', sub: 'Build out your full kit' },
    { label: '25 credits', price: '$17.99', sub: 'A full season of gear calls' },
  ]

  return (
    <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        Pricing
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-10">
        Start free. Pay only if you want more.
      </h2>

      {/* Free tier — the hero */}
      <div className="max-w-2xl mx-auto bg-[#0F2040] border border-[#FF6B35] rounded-lg p-8 shadow-[0_0_40px_rgba(255,107,53,0.08)] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <span className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.15em]">
              Free
            </span>
            <div className="font-display text-4xl text-white mt-1 mb-1">3 credits included</div>
            <p className="text-[#6B7280] text-sm">On signup. No card needed. No subscription, ever.</p>
          </div>
          <Link
            href="/signup"
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-7 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center text-sm shrink-0"
          >
            Get started free →
          </Link>
        </div>
        <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 mt-6 pt-6 border-t border-[#1A3A5C]">
          {creditMath.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-[#D1D5DB]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Paid packs — compact strip, bought in-app when you run low */}
      <p className="text-[#6B7280] text-sm text-center mb-4">Need more? Top up anytime — credits never expire.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {packs.map((pack) => (
          <div
            key={pack.label}
            className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5 text-center hover:-translate-y-1 hover:border-[#FF6B35] hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
          >
            <div className="font-display text-2xl text-white">{pack.price}</div>
            <div className="text-white text-sm font-semibold mt-1">{pack.label}</div>
            <div className="text-[#6B7280] text-xs mt-1">{pack.sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-12 md:py-16 text-center border-t border-[#1A3A5C] mt-4">
      <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
        Stop guessing. Start racing.
      </h2>
      <p className="text-[#D1D5DB] mb-8 max-w-lg mx-auto leading-relaxed">
        Build your athlete profile in 4 minutes and get your first recommendation free.
      </p>
      <Link
        href="/signup"
        className="inline-flex items-center bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] text-base mb-4"
      >
        Build my profile →
      </Link>
      <p className="text-[#6B7280] text-sm">
        No credit card · 3 free credits included
      </p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-[#1A3A5C] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-[#6B7280] text-sm">© 2026 Taprai, LLC</div>
      <div className="text-[#6B7280] text-xs text-center max-w-md">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </div>
      <div className="flex items-center gap-4 text-[#6B7280] text-sm">
        <Link href="/how-it-works" className="hover:text-white transition-colors">Methodology</Link>
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>
    </footer>
  )
}
