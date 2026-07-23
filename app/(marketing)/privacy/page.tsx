import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Tapr',
  description: 'How Tapr collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A1628]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-10"
        >
          ← Back to Tapr
        </Link>

        <h1 className="font-display text-5xl text-white mb-2">PRIVACY POLICY</h1>
        <p className="text-[#6B7280] text-sm mb-12">Last updated: May 2, 2025</p>

        <div className="prose prose-invert max-w-none space-y-10 text-[#D1D5DB] leading-relaxed">

          <section>
            <h2 className="font-display text-2xl text-white mb-3">WHO WE ARE</h2>
            <p>
              Tapr, LLC (&ldquo;Tapr,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates
              the Tapr platform at taprai.com — a personalized endurance sports gear recommendation service. We are based in
              North Carolina, United States.
            </p>
            <p className="mt-3">
              Questions about this policy? Contact us at{' '}
              <Link href="/contact" className="text-[#FF6B35] hover:underline">contact us</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">WHAT WE COLLECT</h2>

            <h3 className="text-white font-semibold mt-5 mb-2">Account Information</h3>
            <p>
              When you create an account, we collect your email address and a hashed password. Authentication
              is handled by Supabase Auth.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Athlete Profile</h3>
            <p>
              To generate personalized gear recommendations, we ask you to complete a profile. This may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your sport and race distances</li>
              <li>Background sport, gender, and birth month and year</li>
              <li>City and state</li>
              <li>Height and weight</li>
              <li>Body measurements (inseam, torso length, arm span, shoulder width, chest and hip circumference, neck circumference)</li>
              <li>Flexibility level, arch type, and foot width</li>
              <li>Budget preferences, existing gear, and known fit issues</li>
              <li>Target race name and date</li>
            </ul>
            <p className="mt-3">
              This information is used solely to generate gear recommendations. We do not sell it, and we do not
              use it for advertising. Body measurements you provide are fitness-related data — not medical records —
              but we treat them with the same care.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Questionnaire Responses</h3>
            <p>
              When you request a recommendation, you answer category-specific questions (e.g., wetsuit water
              temperature, GPS watch battery needs). We store these responses linked to your recommendation history.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Recommendation and Comparison History</h3>
            <p>
              We store the recommendations and comparisons we generate for you, including the AI-generated output
              and a snapshot of your profile at the time of generation.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Usage Data</h3>
            <p>
              We track how many recommendations and product comparisons you run each day and month to enforce
              plan limits. We also log affiliate link clicks (product name, timestamp) to attribute commissions.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Subscription and Payment Data</h3>
            <p>
              If you subscribe to Tapr Pro, payment processing is handled entirely by Stripe. We store your
              subscription plan and status, but we never receive or store your credit card number, CVV, or full
              payment details.
            </p>

            <h3 className="text-white font-semibold mt-5 mb-2">Email Notifications</h3>
            <p>
              If you request to be notified when a gear category launches, we store your email for that purpose
              only. You can opt out at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">HOW WE USE YOUR DATA</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To generate personalized gear recommendations and comparisons</li>
              <li>To maintain your account and subscription</li>
              <li>To enforce usage limits on your plan</li>
              <li>To send transactional emails (subscription receipts, category launch notifications you requested)</li>
              <li>To attribute affiliate commissions when you click through to a retailer</li>
              <li>To improve the quality of our recommendations over time</li>
            </ul>
            <p className="mt-4">
              We do not use your data to serve you advertising. We do not sell your data to third parties.
              We do not share your athlete profile with gear brands or retailers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">THIRD-PARTY SERVICES</h2>
            <p>
              Tapr uses the following third-party services. By using Tapr, you acknowledge that data described
              below may be processed by these providers under their own privacy policies.
            </p>

            <div className="mt-4 space-y-4">
              <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <p className="text-white font-semibold">Supabase</p>
                <p className="text-sm mt-1">
                  Our database, authentication, and file storage provider. All user data — including your athlete
                  profile, recommendation history, and account credentials — is stored on Supabase infrastructure.
                  Supabase operates data centers in the United States and EU.
                </p>
              </div>

              <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <p className="text-white font-semibold">Anthropic</p>
                <p className="text-sm mt-1">
                  Our AI provider. When you request a recommendation or product comparison, your athlete profile,
                  questionnaire responses, and budget information are included in the prompt sent to Anthropic&apos;s
                  Claude API. Anthropic processes this data to generate your recommendation. Anthropic&apos;s API
                  usage policies prohibit them from training models on API inputs without consent.
                  See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">Anthropic&apos;s Privacy Policy</a>.
                </p>
              </div>

              <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <p className="text-white font-semibold">Stripe</p>
                <p className="text-sm mt-1">
                  Payment processing for Tapr credit pack purchases. Stripe handles all payment card data and is
                  PCI-DSS compliant. We receive only payment confirmation and transaction information.
                  See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">Stripe&apos;s Privacy Policy</a>.
                </p>
              </div>

              <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <p className="text-white font-semibold">Resend</p>
                <p className="text-sm mt-1">
                  Transactional email delivery. We share your email address with Resend only to send emails you
                  have explicitly requested or that are necessary for your account (e.g., subscription receipts).
                </p>
              </div>

              <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <p className="text-white font-semibold">Vercel</p>
                <p className="text-sm mt-1">
                  Hosting and infrastructure. Vercel processes server request logs and provides basic
                  aggregate analytics. No personally identifiable information is shared with Vercel beyond
                  what is inherent in serving web requests.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">AFFILIATE LINKS</h2>
            <p>
              Tapr earns commissions when you purchase gear through links on our platform. When you click an
              affiliate link, we log the click (product name, timestamp, your user ID) before redirecting you
              to the retailer. Retailers may set their own tracking cookies.
            </p>
            <p className="mt-3">
              Affiliate relationships never influence our recommendations. Products are ranked solely on
              fit to your athlete profile, review data, and performance characteristics.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">DATA RETENTION</h2>
            <p>
              We retain your account and profile data for as long as your account is active. Recommendation
              and comparison history is retained to power your history view and improve future recommendations.
            </p>
            <p className="mt-3">
              If you delete your account, we will delete your personal data within 30 days, except where
              we are required to retain it for legal or financial compliance (e.g., subscription transaction
              records).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">YOUR RIGHTS</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate profile data (via the Profile page in your account)</li>
              <li>Request deletion of your account and personal data</li>
              <li>Opt out of non-essential emails at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <Link href="/contact" className="text-[#FF6B35] hover:underline">contact us</Link>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">CHILDREN</h2>
            <p>
              Tapr is not directed at children under 13. We do not knowingly collect personal data from
              anyone under 13. If you believe a child has provided us with personal data, contact us and
              we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">CHANGES TO THIS POLICY</h2>
            <p>
              We may update this policy as the service evolves. If we make material changes, we will notify
              you by email or by posting a notice in the app. Continued use of Tapr after changes take effect
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">GOVERNING LAW</h2>
            <p>
              This Privacy Policy is governed by the laws of the State of North Carolina, United States,
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-white mb-3">CONTACT</h2>
            <p>
              Tapr, LLC<br />
              North Carolina, United States<br />
              <Link href="/contact" className="text-[#FF6B35] hover:underline">contact us</Link>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
