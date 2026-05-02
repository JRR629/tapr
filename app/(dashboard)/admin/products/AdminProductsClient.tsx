'use client'

import { useState, useCallback } from 'react'
import type { GearCategory } from '@/types/gear'
import type { GearProductWithReviews, ReviewSource } from '@/types/gear'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReviewSourceDraft {
  id?: string
  source_name: string
  source_url: string
  source_type: 'written' | 'video' | 'community' | 'retailer'
  review_date: string
  sentiment: 'positive' | 'mixed' | 'negative' | ''
  key_points: string[]
  full_summary: string
  flexibility_score: string
  buoyancy_score: string
  comfort_score: string
  durability_score: string
  value_score: string
}

interface SpecRow {
  key: string
  value: string
}

interface ProductFormState {
  category_id: string
  sub_category: string
  name: string
  brand: string
  model: string
  price_usd: string
  price_range: 'budget' | 'mid' | 'premium' | 'elite' | ''
  price_tier: 'entry' | 'mid' | 'premium' | ''
  buoyancy_profile: 'maximum' | 'balanced' | 'flexibility_focused' | ''
  swimmer_level: ('beginner' | 'intermediate' | 'advanced')[]
  race_distance_focus: 'sprint' | 'olympic' | 'half_distance' | 'full_distance' | ''
  gender_category: 'mens' | 'womens' | 'unisex' | ''
  affiliate_url: string
  image_path: string
  overall_rating: string
  best_for: string[]
  not_ideal_for: string[]
  specs: SpecRow[]
  review_sources: ReviewSourceDraft[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function emptyForm(categories: GearCategory[]): ProductFormState {
  return {
    category_id: categories[0]?.id ?? '',
    sub_category: '',
    name: '',
    brand: '',
    model: '',
    price_usd: '',
    price_range: '',
    price_tier: '',
    buoyancy_profile: '',
    swimmer_level: [],
    race_distance_focus: '',
    gender_category: '',
    affiliate_url: '',
    image_path: '',
    overall_rating: '',
    best_for: [],
    not_ideal_for: [],
    specs: [],
    review_sources: [],
  }
}

function productToForm(product: GearProductWithReviews): ProductFormState {
  const specsObj = product.specs ?? {}
  const specs: SpecRow[] = Object.entries(specsObj).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  const review_sources: ReviewSourceDraft[] = (product.review_sources ?? []).map((rs: ReviewSource) => ({
    id: rs.id,
    source_name: rs.source_name,
    source_url: rs.source_url ?? '',
    source_type: rs.source_type as ReviewSourceDraft['source_type'],
    review_date: rs.review_date ?? '',
    sentiment: (rs.sentiment as ReviewSourceDraft['sentiment']) ?? '',
    key_points: rs.key_points ?? [],
    full_summary: rs.full_summary ?? '',
    flexibility_score: rs.flexibility_score != null ? String(rs.flexibility_score) : '',
    buoyancy_score: rs.buoyancy_score != null ? String(rs.buoyancy_score) : '',
    comfort_score: rs.comfort_score != null ? String(rs.comfort_score) : '',
    durability_score: rs.durability_score != null ? String(rs.durability_score) : '',
    value_score: rs.value_score != null ? String(rs.value_score) : '',
  }))

  return {
    category_id: product.category_id,
    sub_category: product.sub_category ?? '',
    name: product.name,
    brand: product.brand,
    model: product.model,
    price_usd: product.price_usd != null ? String(product.price_usd) : '',
    price_range: (product.price_range as ProductFormState['price_range']) ?? '',
    price_tier: (product.price_tier as ProductFormState['price_tier']) ?? '',
    buoyancy_profile: (product.buoyancy_profile as ProductFormState['buoyancy_profile']) ?? '',
    swimmer_level: product.swimmer_level ?? [],
    race_distance_focus: (product.race_distance_focus as ProductFormState['race_distance_focus']) ?? '',
    gender_category: (product.gender_category as ProductFormState['gender_category']) ?? '',
    affiliate_url: '',
    image_path: product.image_path ?? '',
    overall_rating: product.overall_rating != null ? String(product.overall_rating) : '',
    best_for: product.best_for ?? [],
    not_ideal_for: product.not_ideal_for ?? [],
    specs,
    review_sources,
  }
}

function buildProductPayload(form: ProductFormState) {
  const specsObj: Record<string, string> = {}
  form.specs.forEach(({ key, value }) => {
    if (key.trim()) specsObj[key.trim()] = value
  })

  return {
    category_id: form.category_id,
    sub_category: form.sub_category || null,
    name: form.name,
    brand: form.brand,
    model: form.model,
    price_usd: form.price_usd ? Number(form.price_usd) : null,
    price_range: form.price_range || null,
    price_tier: form.price_tier || null,
    buoyancy_profile: form.buoyancy_profile || null,
    swimmer_level: form.swimmer_level.length ? form.swimmer_level : null,
    race_distance_focus: form.race_distance_focus || null,
    gender_category: form.gender_category || null,
    affiliate_url: form.affiliate_url || null,
    image_path: form.image_path || null,
    overall_rating: form.overall_rating ? Number(form.overall_rating) : null,
    best_for: form.best_for.length ? form.best_for : null,
    not_ideal_for: form.not_ideal_for.length ? form.not_ideal_for : null,
    specs: Object.keys(specsObj).length ? specsObj : null,
  }
}

function buildReviewSourcesPayload(form: ProductFormState) {
  return form.review_sources
    .filter((rs) => rs.source_name.trim())
    .map((rs) => ({
      source_name: rs.source_name,
      source_url: rs.source_url || null,
      source_type: rs.source_type,
      review_date: rs.review_date || null,
      sentiment: rs.sentiment || null,
      key_points: rs.key_points.length ? rs.key_points : null,
      full_summary: rs.full_summary || null,
      flexibility_score: rs.flexibility_score ? Number(rs.flexibility_score) : null,
      buoyancy_score: rs.buoyancy_score ? Number(rs.buoyancy_score) : null,
      comfort_score: rs.comfort_score ? Number(rs.comfort_score) : null,
      durability_score: rs.durability_score ? Number(rs.durability_score) : null,
      value_score: rs.value_score ? Number(rs.value_score) : null,
    }))
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder ?? 'Type and press Enter'}
          className="flex-1 bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] min-h-[44px]"
        />
        <button
          type="button"
          onClick={add}
          className="bg-[#1A3A5C] hover:bg-[#FF6B35] text-white px-3 py-2 rounded-md text-sm transition-colors min-h-[44px]"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => remove(tag)}
              className="flex items-center gap-1 bg-[#1A3A5C] hover:bg-[#EF4444] text-white text-xs px-2 py-1 rounded-full transition-colors"
            >
              {tag}
              <span className="ml-1 opacity-70">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SpecsBuilder({ specs, onChange }: { specs: SpecRow[]; onChange: (specs: SpecRow[]) => void }) {
  const addRow = () => onChange([...specs, { key: '', value: '' }])
  const removeRow = (i: number) => onChange(specs.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'key' | 'value', val: string) => {
    const updated = specs.map((row, idx) => (idx === i ? { ...row, [field]: val } : row))
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {specs.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={row.key}
            onChange={(e) => updateRow(i, 'key', e.target.value)}
            placeholder="Key (e.g. thickness)"
            className="flex-1 bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
            placeholder="Value (e.g. 3mm)"
            className="flex-1 bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="text-gray-500 hover:text-[#EF4444] px-2 py-2 transition-colors min-h-[44px]"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-[#FF6B35] hover:text-[#E55A24] transition-colors"
      >
        + Add spec row
      </button>
    </div>
  )
}

function ReviewSourceForm({
  source,
  index,
  onChange,
  onRemove,
}: {
  source: ReviewSourceDraft
  index: number
  onChange: (index: number, updated: ReviewSourceDraft) => void
  onRemove: (index: number) => void
}) {
  const update = (field: keyof ReviewSourceDraft, value: unknown) =>
    onChange(index, { ...source, [field]: value })

  return (
    <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Source {index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-gray-500 hover:text-[#EF4444] text-sm transition-colors"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-300 text-xs mb-1">Source Name *</label>
          <input
            type="text"
            value={source.source_name}
            onChange={(e) => update('source_name', e.target.value)}
            placeholder="e.g. DC Rainmaker"
            className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-xs mb-1">Source URL</label>
          <input
            type="text"
            value={source.source_url}
            onChange={(e) => update('source_url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-xs mb-1">Source Type</label>
          <select
            value={source.source_type}
            onChange={(e) => update('source_type', e.target.value)}
            className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          >
            <option value="written">Written</option>
            <option value="video">Video</option>
            <option value="community">Community</option>
            <option value="retailer">Retailer</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-300 text-xs mb-1">Review Date</label>
          <input
            type="date"
            value={source.review_date}
            onChange={(e) => update('review_date', e.target.value)}
            className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-xs mb-1">Sentiment</label>
          <select
            value={source.sentiment}
            onChange={(e) => update('sentiment', e.target.value)}
            className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
          >
            <option value="">— Select —</option>
            <option value="positive">Positive</option>
            <option value="mixed">Mixed</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-xs mb-1">Key Points</label>
        <TagInput
          tags={source.key_points}
          onChange={(tags) => update('key_points', tags)}
          placeholder="Add a key point and press Enter"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-xs mb-1">Full Summary</label>
        <textarea
          value={source.full_summary}
          onChange={(e) => update('full_summary', e.target.value)}
          rows={3}
          placeholder="Paste or type full review summary..."
          className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-xs mb-2">Scores (1–5)</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              ['flexibility_score', 'Flexibility'],
              ['buoyancy_score', 'Buoyancy'],
              ['comfort_score', 'Comfort'],
              ['durability_score', 'Durability'],
              ['value_score', 'Value'],
            ] as [keyof ReviewSourceDraft, string][]
          ).map(([field, label]) => (
            <div key={field}>
              <label className="block text-gray-500 text-xs mb-1">{label}</label>
              <input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={source[field] as string}
                onChange={(e) => update(field, e.target.value)}
                className="w-full bg-[#0F2040] border border-[#1A3A5C] text-white rounded-md px-2 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Input helpers ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] min-h-[44px]'
const selectCls =
  'w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]'
const labelCls = 'block text-gray-300 text-xs mb-1'
const sectionHeadingCls = 'font-display text-lg text-white tracking-wide mb-3 pt-2 border-t border-[#1A3A5C]'

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ─── Product Form ──────────────────────────────────────────────────────────────

function ProductForm({
  form,
  setForm,
  categories,
  editingId,
  onSave,
  onCancel,
  saving,
  error,
}: {
  form: ProductFormState
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>
  categories: GearCategory[]
  editingId: string | null
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string
}) {
  const update = (field: keyof ProductFormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addReviewSource = () =>
    setForm((prev) => ({
      ...prev,
      review_sources: [
        ...prev.review_sources,
        {
          source_name: '',
          source_url: '',
          source_type: 'written',
          review_date: '',
          sentiment: '',
          key_points: [],
          full_summary: '',
          flexibility_score: '',
          buoyancy_score: '',
          comfort_score: '',
          durability_score: '',
          value_score: '',
        },
      ],
    }))

  const updateReviewSource = (index: number, updated: ReviewSourceDraft) =>
    setForm((prev) => {
      const sources = [...prev.review_sources]
      sources[index] = updated
      return { ...prev, review_sources: sources }
    })

  const removeReviewSource = (index: number) =>
    setForm((prev) => ({
      ...prev,
      review_sources: prev.review_sources.filter((_, i) => i !== index),
    }))

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-white tracking-wide">
          {editingId ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Section 1 — Basic Info */}
      <div className="space-y-4">
        <h3 className={sectionHeadingCls}>BASIC INFO</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Category *">
            <select
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              className={selectCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Sub-category">
            <input
              type="text"
              value={form.sub_category}
              onChange={(e) => update('sub_category', e.target.value)}
              placeholder="e.g. helmets, sunglasses"
              className={inputCls}
            />
          </FormField>
          <FormField label="Product Name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Maverick Pro II"
              className={inputCls}
            />
          </FormField>
          <FormField label="Brand *">
            <input
              type="text"
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
              placeholder="e.g. ROKA"
              className={inputCls}
            />
          </FormField>
          <FormField label="Model *">
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder="e.g. Maverick Pro II"
              className={inputCls}
            />
          </FormField>
          <FormField label="Price (USD)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price_usd}
              onChange={(e) => update('price_usd', e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </FormField>
          <FormField label="Price Range">
            <select
              value={form.price_range}
              onChange={(e) => update('price_range', e.target.value)}
              className={selectCls}
            >
              <option value="">— Select —</option>
              <option value="budget">Budget</option>
              <option value="mid">Mid</option>
              <option value="premium">Premium</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Price Tier">
            <select
              value={form.price_tier}
              onChange={(e) => update('price_tier', e.target.value)}
              className={selectCls}
            >
              <option value="">— Select —</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="premium">Premium</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* Section 2 — Wetsuit Profile */}
      <div className="space-y-4">
        <h3 className={sectionHeadingCls}>WETSUIT PROFILE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Buoyancy Profile">
            <select
              value={form.buoyancy_profile}
              onChange={(e) => update('buoyancy_profile', e.target.value)}
              className={selectCls}
            >
              <option value="">— Select —</option>
              <option value="maximum">Maximum</option>
              <option value="balanced">Balanced</option>
              <option value="flexibility_focused">Flexibility Focused</option>
            </select>
          </FormField>
          <FormField label="Swimmer Level">
            <div className="flex gap-4 pt-1">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <label key={level} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.swimmer_level.includes(level)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.swimmer_level, level]
                        : form.swimmer_level.filter((l) => l !== level)
                      update('swimmer_level', next)
                    }}
                    className="accent-[#FF6B35]"
                  />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Race Distance Focus">
            <select
              value={form.race_distance_focus}
              onChange={(e) => update('race_distance_focus', e.target.value)}
              className={selectCls}
            >
              <option value="">— Select —</option>
              <option value="sprint">Sprint</option>
              <option value="olympic">Olympic</option>
              <option value="half_distance">Half Distance</option>
              <option value="full_distance">Full Distance</option>
            </select>
          </FormField>
          <FormField label="Gender Category">
            <select
              value={form.gender_category}
              onChange={(e) => update('gender_category', e.target.value)}
              className={selectCls}
            >
              <option value="">— Select —</option>
              <option value="mens">Men&apos;s</option>
              <option value="womens">Women&apos;s</option>
              <option value="unisex">Unisex</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* Section 3 — Details */}
      <div className="space-y-4">
        <h3 className={sectionHeadingCls}>DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Affiliate URL — stored securely, never shown to athletes">
            <input
              type="text"
              value={form.affiliate_url}
              onChange={(e) => update('affiliate_url', e.target.value)}
              placeholder="https://affiliate.example.com/..."
              className={inputCls}
            />
          </FormField>
          <FormField label="Image Path (relative, e.g. wetsuits/roka-maverick-pro-ii.jpg)">
            <input
              type="text"
              value={form.image_path}
              onChange={(e) => update('image_path', e.target.value)}
              placeholder="category/brand-model.jpg"
              className={inputCls}
            />
          </FormField>
          <FormField label="Overall Rating (0–5)">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.overall_rating}
              onChange={(e) => update('overall_rating', e.target.value)}
              placeholder="0.0"
              className={inputCls}
            />
          </FormField>
        </div>

        <FormField label="Best For">
          <TagInput
            tags={form.best_for}
            onChange={(tags) => update('best_for', tags)}
            placeholder="e.g. open water swimmers — press Enter"
          />
        </FormField>
        <FormField label="Not Ideal For">
          <TagInput
            tags={form.not_ideal_for}
            onChange={(tags) => update('not_ideal_for', tags)}
            placeholder="e.g. pool-only training — press Enter"
          />
        </FormField>

        <div>
          <label className={labelCls}>Specs</label>
          <SpecsBuilder specs={form.specs} onChange={(specs) => update('specs', specs)} />
        </div>
      </div>

      {/* Section 4 — Review Sources */}
      <div className="space-y-4">
        <h3 className={sectionHeadingCls}>REVIEW SOURCES</h3>
        {form.review_sources.length === 0 && (
          <p className="text-gray-500 text-sm">No review sources yet. Add one below.</p>
        )}
        {form.review_sources.map((source, i) => (
          <ReviewSourceForm
            key={i}
            source={source}
            index={i}
            onChange={updateReviewSource}
            onRemove={removeReviewSource}
          />
        ))}
        <button
          type="button"
          onClick={addReviewSource}
          className="text-sm text-[#FF6B35] hover:text-[#E55A24] transition-colors"
        >
          + Add review source
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-[#1A3A5C]">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md transition-colors hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
        >
          {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-6 py-3 rounded-md transition-colors min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-gray-600 text-xs">—</span>
  const color =
    tier === 'premium'
      ? 'text-[#FF6B35] bg-[rgba(255,107,53,0.12)]'
      : tier === 'mid'
        ? 'text-[#F59E0B] bg-[rgba(245,158,11,0.12)]'
        : 'text-gray-300 bg-[#1A3A5C]'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${color}`}>
      {tier}
    </span>
  )
}

function BuoyancyBadge({ profile }: { profile: string | null }) {
  if (!profile) return <span className="text-gray-600 text-xs">—</span>
  const label: Record<string, string> = {
    maximum: 'Max',
    balanced: 'Balanced',
    flexibility_focused: 'Flex',
  }
  return (
    <span className="text-xs text-gray-300 bg-[#1A3A5C] px-2 py-0.5 rounded-full">
      {label[profile] ?? profile}
    </span>
  )
}

function ActiveToggle({
  productId,
  isActive,
  onToggle,
}: {
  productId: string
  isActive: boolean
  onToggle: (id: string, active: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(productId, !isActive)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 focus:ring-offset-[#0F2040] ${
        isActive ? 'bg-[#FF6B35]' : 'bg-[#1A3A5C]'
      }`}
      aria-label={isActive ? 'Deactivate product' : 'Activate product'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  products: GearProductWithReviews[]
  categories: GearCategory[]
}

export function AdminProductsClient({ products: initialProducts, categories }: Props) {
  const [products, setProducts] = useState<GearProductWithReviews[]>(initialProducts)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(() => emptyForm(categories))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Filters ──

  const filtered = products.filter((p) => {
    const catMatch = categoryFilter === 'all' || p.category_id === categoryFilter
    const activeMatch =
      activeFilter === 'all' ||
      (activeFilter === 'active' && p.is_active) ||
      (activeFilter === 'inactive' && !p.is_active)
    return catMatch && activeMatch
  })

  // ── Toggle active/inactive ──

  const handleToggleActive = useCallback(async (id: string, active: boolean) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: active }),
    })
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: active } : p)))
    }
  }, [])

  // ── Edit ──

  const handleEdit = useCallback(
    async (product: GearProductWithReviews) => {
      // Fetch full product with review sources
      const res = await fetch(`/api/admin/products?id=${product.id}`)
      const json = await res.json()
      const full: GearProductWithReviews = json.data ?? product
      setForm(productToForm(full))
      setEditingId(product.id)
      setShowForm(true)
      setFormError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    []
  )

  // ── Open add form ──

  const handleOpenAdd = () => {
    setForm(emptyForm(categories))
    setEditingId(null)
    setShowForm(true)
    setFormError('')
  }

  // ── Cancel ──

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormError('')
  }

  // ── Save ──

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim() || !form.category_id) {
      setFormError('Name, brand, model, and category are required.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingId) {
        // PATCH — product fields only (review sources managed separately in full editing flow)
        const payload = { id: editingId, ...buildProductPayload(form) }
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          setFormError(json.error ?? 'Failed to save product.')
          return
        }
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  ...(json.data as GearProductWithReviews),
                  gear_categories: p.gear_categories,
                  review_sources: p.review_sources,
                }
              : p
          )
        )
        setShowForm(false)
        setEditingId(null)
      } else {
        // POST — new product + review sources
        const payload = {
          product: buildProductPayload(form),
          reviewSources: buildReviewSourcesPayload(form),
        }
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          setFormError(json.error ?? 'Failed to create product.')
          return
        }
        // Reload the full list by refreshing the page data
        window.location.reload()
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Delete (soft) ──

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: false } : p)))
    }
    setConfirmDeleteId(null)
  }

  // ─── Category name lookup ──────────────────────────────────────────────────

  const categoryName = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId)
      return cat?.name ?? '—'
    },
    [categories]
  )

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-h-screen bg-[#0A1628] p-6 md:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-5xl text-white tracking-wide">ADMIN — PRODUCTS</h1>
        <p className="text-gray-400 text-sm mt-1 font-sans">
          {products.length} product{products.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8">
          <ProductForm
            form={form}
            setForm={setForm}
            categories={categories}
            editingId={editingId}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
            error={formError}
          />
        </div>
      )}

      {/* Filter bar + Add button */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0F2040] border border-[#1A3A5C] text-white rounded-md px-3 py-2 text-sm focus:border-[#FF6B35] focus:outline-none min-h-[44px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-md overflow-hidden border border-[#1A3A5C]">
          {(['all', 'active', 'inactive'] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setActiveFilter(val)}
              className={`px-4 py-2 text-sm capitalize transition-colors min-h-[44px] ${
                activeFilter === val
                  ? 'bg-[#FF6B35] text-white font-semibold'
                  : 'bg-[#0F2040] text-gray-400 hover:text-white'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-5 py-2 rounded-md transition-colors hover:scale-[1.02] active:scale-[0.98] min-h-[44px] text-sm"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Products table */}
      {filtered.length === 0 ? (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-white font-display text-xl tracking-wide">NO PRODUCTS</p>
          <p className="text-gray-500 text-sm mt-1">Add your first product using the button above.</p>
        </div>
      ) : (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A3A5C]">
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Product</th>
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Category</th>
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Price</th>
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Tier</th>
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Buoyancy</th>
                  <th className="text-left text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Active</th>
                  <th className="text-right text-gray-400 font-semibold px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => (
                  <tr
                    key={product.id}
                    className={`border-b border-[#1A3A5C] last:border-0 transition-colors hover:bg-[#0A1628]/40 ${
                      i % 2 === 0 ? '' : 'bg-[#0A1628]/20'
                    } ${!product.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white leading-tight">{product.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {product.brand} · {product.model}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {product.gear_categories?.name ?? categoryName(product.category_id)}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {product.price_usd != null ? `$${product.price_usd.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={product.price_tier} />
                    </td>
                    <td className="px-4 py-3">
                      <BuoyancyBadge profile={product.buoyancy_profile} />
                    </td>
                    <td className="px-4 py-3">
                      <ActiveToggle
                        productId={product.id}
                        isActive={product.is_active}
                        onToggle={handleToggleActive}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="text-gray-400 hover:text-[#FF6B35] text-xs px-3 py-2 rounded border border-[#1A3A5C] hover:border-[#FF6B35] transition-colors min-h-[44px]"
                        >
                          Edit
                        </button>
                        {confirmDeleteId === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="text-xs text-white bg-[#EF4444] hover:bg-[#DC2626] px-3 py-2 rounded transition-colors min-h-[44px]"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-400 hover:text-white px-2 py-2 transition-colors min-h-[44px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="text-gray-500 hover:text-[#EF4444] text-xs px-3 py-2 rounded border border-[#1A3A5C] hover:border-[#EF4444] transition-colors min-h-[44px]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
