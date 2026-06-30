'use client'

import { useState } from 'react'

interface DateSelectProps {
  value: string // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void
  /**
   * Year range:
   *  'past'   = birthdays (currentYear-13 … currentYear-100, descending)
   *  'recent' = recent past dates e.g. review dates (currentYear … currentYear-30, descending)
   *  'future' = upcoming dates e.g. races (currentYear … currentYear+6, ascending)
   */
  range: 'past' | 'recent' | 'future'
  /** Prefix for aria-labels, e.g. "Birth" → "Birth month". */
  ariaPrefix?: string
}

const MONTHS: [string, string][] = [
  ['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'],
  ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'],
  ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December'],
]

const SELECT_CLS =
  'w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-3 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] [color-scheme:dark] cursor-pointer'

// Shared themed date picker — three on-brand dropdowns (Month / Day / Year) used
// for EVERY date field in the app. Replaces native <input type="date">, whose
// popup is browser-controlled (unthemeable, inconsistent, finicky). On mobile
// each dropdown becomes the native wheel picker. Stores 'YYYY-MM-DD' only when
// all three are chosen; '' otherwise.
export function DateSelect({ value, onChange, range, ariaPrefix = '' }: DateSelectProps) {
  const parts = (value || '').split('-')
  const [year, setYear] = useState(parts[0] ?? '')
  const [month, setMonth] = useState(parts[1] ?? '')
  const [day, setDay] = useState(parts[2] ?? '')

  const currentYear = new Date().getFullYear()
  const years =
    range === 'past'
      ? Array.from({ length: 88 }, (_, i) => String(currentYear - 13 - i)) // 13–100 yrs old
      : range === 'recent'
        ? Array.from({ length: 31 }, (_, i) => String(currentYear - i)) // this year … -30
        : Array.from({ length: 7 }, (_, i) => String(currentYear + i)) // this year … +6

  const daysInMonth = (yy: string, mm: string) =>
    yy && mm ? new Date(Number(yy), Number(mm), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) =>
    String(i + 1).padStart(2, '0')
  )

  const sync = (yy: string, mm: string, dd: string) => {
    const maxD = daysInMonth(yy, mm)
    if (dd && Number(dd) > maxD) {
      dd = String(maxD).padStart(2, '0')
      setDay(dd)
    }
    onChange(yy && mm && dd ? `${yy}-${mm}-${dd}` : '')
  }

  const lbl = (s: string) => (ariaPrefix ? `${ariaPrefix} ${s}` : s)

  return (
    <div className="grid grid-cols-3 gap-3">
      <select aria-label={lbl('month')} value={month} className={SELECT_CLS}
        onChange={(e) => { setMonth(e.target.value); sync(year, e.target.value, day) }}>
        <option value="">Month</option>
        {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select aria-label={lbl('day')} value={day} className={SELECT_CLS}
        onChange={(e) => { setDay(e.target.value); sync(year, month, e.target.value) }}>
        <option value="">Day</option>
        {days.map((v) => <option key={v} value={v}>{Number(v)}</option>)}
      </select>
      <select aria-label={lbl('year')} value={year} className={SELECT_CLS}
        onChange={(e) => { setYear(e.target.value); sync(e.target.value, month, day) }}>
        <option value="">Year</option>
        {years.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  )
}
