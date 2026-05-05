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
    <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
      <div>
        <div className="font-display text-5xl leading-none text-[#FF6B35]">TAPR</div>
        <div className="text-[#6B7280] text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5">Gear. Matched. Perfectly.</div>
      </div>
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
    <section className="max-w-4xl mx-auto px-6 py-24 md:py-36 text-center">
      <div className="inline-flex items-center gap-2 bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
        Launching soon
      </div>
      <h1 className="font-display text-6xl md:text-8xl text-white leading-none mb-6">
        Gear that fits your race.
        <br />
        Not someone else's.
      </h1>
      <p className="text-[#D1D5DB] text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
        Tapr asks the questions that matter, runs your answers against expert reviews, and tells you exactly what to buy — and why it's right for you specifically.
      </p>
      <div className="flex flex-col items-center gap-4">
        <a
          href="#waitlist"
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-8 py-4 rounded-md text-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[52px] flex items-center justify-center"
        >
          Get notified at launch →
        </a>
        <p className="text-[#6B7280] text-sm">5 free credits included at launch · No credit card required · Built for triathletes</p>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Build your profile',
      body: 'Tell us your race distances, experience, budget, and existing gear. Takes 4 minutes. This is the context generic advice never has.',
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
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        How it works
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-16">
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
    <section className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em] text-center mb-3">
        Why tapr
      </div>
      <h2 className="font-display text-5xl md:text-6xl text-white text-center mb-16">
        Three ways people research gear.
        <br />
        Here's what each one gets you.
      </h2>
      <div className="flex flex-col gap-6">
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7">
          <h3 className="font-display text-3xl text-white mb-3">Google it</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            You'll find lists. "Best GPS watches for triathlon 2025." They're written by publications that reviewed two or three watches, sometimes by writers who don't race. The top result is whoever has the best SEO, not whoever has the best answer. The recommendations don't know your race distance, your budget, or that you already own a Garmin Edge and switching ecosystems means starting your training history over. You'll read four articles that broadly agree on the top pick, feel mildly confident, and still wonder if you missed something.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-7">
          <h3 className="font-display text-3xl text-white mb-3">Ask an AI</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            Getting better. A frontier model like ChatGPT or Gemini will give you a coherent, well-structured answer — and if you're a sophisticated prompter who includes your race distance, budget, existing devices, and training goals, you'll get something reasonably useful. The problem is threefold: you have to know what context to include, the model can't verify its claims against current review data, and there's no accountability for whether the recommendation was actually right for you. You'll also get a different answer next week because the model changed.
          </p>
        </div>
        <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-7">
          <h3 className="font-display text-3xl text-[#FF6B35] mb-3">Tapr</h3>
          <p className="text-[#D1D5DB] leading-relaxed">
            Your profile is already there. The right questions get asked automatically — including ones you wouldn't think to include in a chat prompt, like whether you train with a power meter, how many bikes you ride, and whether your target race is wetsuit-legal. Every recommendation is grounded in structured data from the reviews that serious athletes actually trust, with scores that reflect what reviewers found when they tested the product. The output is a specific answer with a specific explanation for your specific situation. And it takes three minutes.
          </p>
        </div>
      </div>
      <p className="text-[#6B7280] text-center text-sm italic mt-8">
        The right gear decision isn't about finding more information. It's about filtering the right information for you. That's what Tapr is built to do.
      </p>
    </section>
  )
}

function FinalCTA() {
  return (
    <section id="waitlist" className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
        Be first through the door.
      </h2>
      <p className="text-[#D1D5DB] mb-8 max-w-lg mx-auto">
        We're putting the finishing touches on Tapr. Drop your email and you'll get a launch-day notification — plus 5 free credits to start.
      </p>
      <EmailCapture />
    </section>
  )
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-[#1A3A5C] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-[#6B7280] text-sm">© 2025 Taprai, LLC</div>
      <div className="text-[#6B7280] text-xs text-center max-w-md">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </div>
      <div className="flex items-center gap-4 text-[#6B7280] text-sm">
        <a href="#waitlist" className="hover:text-white transition-colors">Join waitlist</a>
      </div>
    </footer>
  )
}
