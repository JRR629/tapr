'use client'

import { useState } from 'react'
import { ProfileEditClient } from './ProfileEditClient'
import type { AthleteProfile } from '@/types/profile'

const EXPERIENCE_LABELS: Record<string, string> = {
  first_season: 'First Season',
  '1_3_years': '1–3 Years',
  '3_plus_years': '3+ Years',
  from_other_sport: 'From Other Sport',
}
const BUDGET_LABELS: Record<string, string> = {
  value: 'Value',
  mid: 'Mid-Range',
  performance: 'Performance',
  no_limit: 'No Limit',
}
const DISTANCE_LABELS: Record<string, string> = {
  sprint: 'Sprint',
  olympic: 'Olympic',
  '70.3': '70.3',
  ironman: 'Ironman',
}
const FIT_ISSUE_LABELS: Record<string, string> = {
  shoulder_tightness: 'Shoulder Tightness',
  wide_feet: 'Wide Feet',
  narrow_shoulders: 'Narrow Shoulders',
  short_torso: 'Short Torso',
  long_torso: 'Long Torso',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-[#1A3A5C] last:border-0">
      <dt className="text-[#9CA3AF] text-sm shrink-0 mr-4">{label}</dt>
      <dd className="text-white text-sm text-right">{value || '—'}</dd>
    </div>
  )
}

function formatList<T extends string>(items: T[] | null | undefined, map: Record<string, string>): string {
  if (!items || items.length === 0) return '—'
  return items.map((i) => map[i] ?? i).join(', ')
}

interface ProfilePageClientProps {
  profile: AthleteProfile | null
}

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const [editing, setEditing] = useState(!profile)

  if (editing || !profile) {
    return (
      <div>
        {profile && (
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to profile
          </button>
        )}
        <ProfileEditClient profile={profile} />
      </div>
    )
  }

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  const fitIssues = profile.fit_issues?.filter(Boolean) ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Core profile */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-white">ATHLETE INFO</h2>
          <button
            onClick={() => setEditing(true)}
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-5 py-2 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] text-sm min-h-[44px]"
          >
            Edit Profile
          </button>
        </div>
        <dl>
          <Row label="Experience" value={EXPERIENCE_LABELS[profile.experience_level ?? ''] ?? '—'} />
          <Row label="Race Distances" value={formatList(profile.race_distances, DISTANCE_LABELS)} />
          <Row label="Budget Style" value={BUDGET_LABELS[profile.budget_style ?? ''] ?? '—'} />
          <Row label="Location" value={location || '—'} />
          <Row label="Target Race" value={profile.target_race_name ?? '—'} />
          {profile.target_race_date && (
            <Row
              label="Race Date"
              value={new Date(profile.target_race_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            />
          )}
          {(profile.height_feet || profile.weight_lbs) && (
            <Row
              label="Height / Weight"
              value={[
                profile.height_feet ? `${profile.height_feet}'${profile.height_inches ?? 0}"` : null,
                profile.weight_lbs ? `${profile.weight_lbs} lbs` : null,
              ].filter(Boolean).join(' · ')}
            />
          )}
          {profile.existing_gear && profile.existing_gear.length > 0 && (
            <Row label="Current Gear" value={profile.existing_gear.join(', ')} />
          )}
        </dl>

        {fitIssues.length > 0 && (
          <div className="mt-4">
            <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2">Known Fit Issues</p>
            <div className="flex flex-wrap gap-2">
              {fitIssues.map((issue) => (
                <span
                  key={issue}
                  className="bg-[#FF6B3520] text-[#FF6B35] text-sm font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                >
                  {FIT_ISSUE_LABELS[issue] ?? issue}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Measurements — only show section if any are filled */}
      {(profile.inseam_inches || profile.torso_length_inches || profile.shoulder_width_inches || profile.foot_width) && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
          <h2 className="font-display text-2xl text-white mb-4">MEASUREMENTS</h2>
          <dl>
            {profile.inseam_inches && <Row label="Inseam" value={`${profile.inseam_inches}"`} />}
            {profile.torso_length_inches && <Row label="Torso Length" value={`${profile.torso_length_inches}"`} />}
            {profile.shoulder_width_inches && <Row label="Shoulder Width" value={`${profile.shoulder_width_inches}"`} />}
            {profile.arm_length_inches && <Row label="Arm Length" value={`${profile.arm_length_inches}"`} />}
            {profile.foot_width && <Row label="Foot Width" value={profile.foot_width} />}
            {profile.arch_type && <Row label="Arch Type" value={profile.arch_type} />}
            {profile.flexibility_level && <Row label="Flexibility" value={profile.flexibility_level} />}
          </dl>
        </div>
      )}

      <p className="text-[#9CA3AF] text-sm leading-relaxed">
        Your profile powers every recommendation. Keep it accurate as your goals and gear change.
      </p>
    </div>
  )
}
