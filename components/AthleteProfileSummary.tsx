import Link from 'next/link'
import type { AthleteProfile } from '@/types/profile'

interface AthleteProfileSummaryProps {
  profile: AthleteProfile
}

// Label maps for snake_case → readable
const EXPERIENCE_LABELS: Record<string, string> = {
  first_season: 'First Season',
  '1_3_years': '1–3 Years',
  '3_plus_years': '3+ Years',
  from_other_sport: 'From Other Sport',
}

const SPORT_LABELS: Record<string, string> = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  gym: 'Gym / Fitness',
  none: 'None',
}

const DISTANCE_LABELS: Record<string, string> = {
  sprint: 'Sprint',
  olympic: 'Olympic',
  '70.3': '70.3',
  ironman: 'Ironman',
}

const BUDGET_LABELS: Record<string, string> = {
  value: 'Value',
  mid: 'Mid-Range',
  performance: 'Performance',
  no_limit: 'No Limit',
}

const FIT_ISSUE_LABELS: Record<string, string> = {
  shoulder_tightness: 'Shoulder Tightness',
  wide_feet: 'Wide Feet',
  narrow_shoulders: 'Narrow Shoulders',
  short_torso: 'Short Torso',
  long_torso: 'Long Torso',
}

function formatList<T extends string>(items: T[] | null, labelMap: Record<string, string>): string {
  if (!items || items.length === 0) return '—'
  return items.map((i) => labelMap[i] ?? i).join(', ')
}

function formatLabel(value: string | null, labelMap: Record<string, string>): string {
  if (!value) return '—'
  return labelMap[value] ?? value
}

interface FieldRowProps {
  label: string
  value: string
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-[#1A3A5C] last:border-0">
      <dt className="text-[#9CA3AF] text-sm flex-shrink-0 mr-4">{label}</dt>
      <dd className="text-white text-sm text-right">{value}</dd>
    </div>
  )
}

export function AthleteProfileSummary({ profile }: AthleteProfileSummaryProps) {
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(', ') || '—'

  const fitIssues = profile.fit_issues?.filter(Boolean) ?? []

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-3xl text-white">YOUR PROFILE</h2>
        <Link
          href="/profile"
          className="text-[#FF6B35] text-sm hover:text-[#E55A24] transition-colors font-semibold min-h-[44px] flex items-center"
        >
          Edit →
        </Link>
      </div>

      <dl className="space-y-0">
        <FieldRow
          label="Experience"
          value={formatLabel(profile.experience_level, EXPERIENCE_LABELS)}
        />
        <FieldRow
          label="Background Sport"
          value={formatList(profile.background_sport, SPORT_LABELS)}
        />
        <FieldRow
          label="Race Distances"
          value={formatList(profile.race_distances, DISTANCE_LABELS)}
        />
        <FieldRow label="Location" value={location} />
        <FieldRow
          label="Budget Style"
          value={formatLabel(profile.budget_style, BUDGET_LABELS)}
        />
        <FieldRow
          label="Target Race"
          value={profile.target_race_name ?? '—'}
        />
      </dl>

      {/* Fit issues as badges */}
      {fitIssues.length > 0 && (
        <div className="mt-4">
          <p className="text-[#9CA3AF] text-sm mb-2">Known Fit Issues</p>
          <div className="flex flex-wrap gap-2">
            {fitIssues.map((issue) => (
              <span
                key={issue}
                className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-sm font-semibold px-2 py-1 rounded-full uppercase tracking-wide"
              >
                {FIT_ISSUE_LABELS[issue] ?? issue}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
