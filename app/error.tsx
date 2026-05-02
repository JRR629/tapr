'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="font-display text-5xl text-white">SOMETHING WENT WRONG</h1>
      <p className="text-[#D1D5DB]">{error.message}</p>
      <button onClick={reset} className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-colors hover:scale-[1.02] active:scale-[0.98]">
        Try Again
      </button>
    </div>
  )
}
