export type ListingStatus = 'available' | 'coming_soon' | 'taken'

export const LISTING_STATUSES: ReadonlyArray<{ value: ListingStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'taken', label: 'Taken' },
]

export function statusLabel(status: ListingStatus): string {
  return LISTING_STATUSES.find((s) => s.value === status)?.label ?? 'Available'
}

/** Pill styling. Semantic colour, kept separate from the brass accent. */
export function statusPillClass(status: ListingStatus): string {
  const base = 'rounded-sm px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide'
  if (status === 'available') return `${base} bg-open-soft text-open`
  if (status === 'coming_soon') return `${base} border border-brass/50 text-brass-deep`
  return `${base} border border-line bg-ivory text-muted`
}

/**
 * How a listing's date reads to a visitor. "Coming soon" is the only state
 * where the date is a promise rather than a detail, so it leads.
 */
export function dateLine(status: ListingStatus, availableFrom: string | null): string | null {
  if (!availableFrom) return status === 'coming_soon' ? 'Date to be confirmed' : null
  return status === 'coming_soon' ? `Expected ${availableFrom}` : `From ${availableFrom}`
}
