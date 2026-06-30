'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, GitCompareArrows, X } from 'lucide-react'
import type { GearCategory } from '@/types/gear'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface CategoryActionModalProps {
  category: GearCategory | null
  onClose: () => void
}

export function CategoryActionModal({ category, onClose }: CategoryActionModalProps) {
  const [visible, setVisible] = useState(false)
  const trapRef = useFocusTrap<HTMLDivElement>(!!category)

  useEffect(() => {
    if (!category) {
      setVisible(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 180)
  }

  if (!category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative bg-[#0F2040] border border-[#1A3A5C] rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto transition-all duration-200 outline-none ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 text-[#6B7280] hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-[#ffffff08]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-6 pr-10">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest font-semibold mb-2">
            {category.name}
          </p>
          <h2 className="font-display text-3xl text-white leading-tight">
            How would you like to research {category.name.toLowerCase()}?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/gear/${category.slug}`}
            className="group bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] hover:bg-[#FF6B3510] rounded-lg p-5 flex flex-col gap-3 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FF6B3520] flex items-center justify-center text-[#FF6B35]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-2xl text-white leading-none">RECOMMEND</p>
              <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
                Answer a few questions and get AI-matched gear for your race profile.
              </p>
            </div>
          </Link>

          <Link
            href={`/gear/${category.slug}/compare`}
            className="group bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] hover:bg-[#FF6B3510] rounded-lg p-5 flex flex-col gap-3 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FF6B3520] flex items-center justify-center text-[#FF6B35]">
              <GitCompareArrows className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-2xl text-white leading-none">COMPARE</p>
              <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed">
                Pick 2–4 specific products and see them side-by-side with an AI verdict.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
