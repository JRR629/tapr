import Image from 'next/image'
import Link from 'next/link'
import EmailCapture from '@/components/EmailCapture'

export const dynamic = 'force-dynamic'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#0A1628]" style={{ background: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 60%)' }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <WhyTapr />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Image
        src="/logo-sidebar.svg"
        alt="Tapr — Gear. Matched. Perfectly."
        width={200}
        height={103}
        priority
      />
      <a
        href="#waitlist"
        className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center"
      >
        Join the waitlist
      </a>
    </nav>
  )
}

function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14 md:py-20 text-center">
      <div className="inline-flex items-center gap-2 bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
        Launching soon
      </div>
      <h1 className="font-display text-6xl md:text-8xl text-white leading-none mb-6">
        Gear that fits your race.
        <br />
        Not someone else&apos;s.
      </h1>
      <p className="text-[#D1D5DB] text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
        Tapr asks the questions that matter, runs your answers against expert reviews, and tells you exactly what to buy — and why it&apos;s right for your sport and body.
      </p>
      <div className="max-w-md mx-auto mb-4">
        <EmailCapture />
      </div>
      <p className="text-[#6B7280] text-sm">3 free credits at launch · No credit card required · For every endurance sport</p>
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
    <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
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

function WhyTapr() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        Why tapr
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-10">
        Three ways people research gear.
        <br />
        Here&apos;s what each one gets you.
      </h2>
      <div className="flex flex-col gap-6">
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7">
          <h3 className="font-display text-3xl text-white mb-3">Google it</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            You&apos;ll find lists. &ldquo;Best running shoes 2025&rdquo; or &ldquo;Best triathlon wetsuits.&rdquo; They&apos;re written by publications that reviewed a handful of options, sometimes by writers who don&apos;t compete in your sport. The top result is whoever has the best SEO, not whoever has the best answer. The recommendations don&apos;t know your sport, your budget, or your fit history. You&apos;ll read four articles that broadly agree on the top pick, feel mildly confident, and still wonder if you missed something.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7">
          <h3 className="font-display text-3xl text-white mb-3">Ask an AI</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            Getting better. A frontier model like ChatGPT or Gemini will give you a coherent, well-structured answer — and if you&apos;re a sophisticated prompter who includes your race distance, budget, existing devices, and training goals, you&apos;ll get something reasonably useful. The problem is threefold: you have to know what context to include, the model can&apos;t verify its claims against current review data, and there&apos;s no accountability for whether the recommendation was actually right for you. You&apos;ll also get a different answer next week because the model changed.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-7 shadow-[0_0_40px_rgba(255,107,53,0.08)]">
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

function FinalCTA() {
  return (
    <section id="waitlist" className="max-w-2xl mx-auto px-6 py-12 md:py-16 text-center border-t border-[#1A3A5C] mt-4">
      <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
        Be first through the door.
      </h2>
      <p className="text-[#D1D5DB] mb-8 max-w-lg mx-auto">
        Launch-day access, 3 free credits, and a recommendation engine that actually knows your sport. One email. No spam.
      </p>
      <EmailCapture />
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
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>
    </footer>
  )
}
