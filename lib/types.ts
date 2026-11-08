// Shapes shared by the server, the settings tab and the Puck block.
//
// Client-safe: no Prisma, no next/headers, nothing that reaches the network. The
// block's editor half imports this file, and the editor half ships to the browser.

/** One review as a visitor's browser receives it. Already cleared to be shown. */
export interface PublicReview {
  id: string
  authorName: string
  /** The reviewer's Google profile. Google's terms ask for the name to link to it. */
  authorUrl: string | null
  authorPhotoUrl: string | null
  /** Whole stars, 1 to 5. */
  rating: number
  text: string
  /** ISO 8601, or null when Google did not say. */
  publishedAt: string | null
  /** Google's own "3 weeks ago", the fallback for a review with no publish time. */
  relativeTime: string | null
  /** The review itself on Google Maps. */
  reviewUrl: string | null
}

/** The business, as Google describes it. Every field is null until the first pull. */
export interface PlaceSummary {
  placeId: string | null
  name: string | null
  mapsUrl: string | null
  /** Google's overall rating, to one decimal place. */
  rating: number | null
  /** How many ratings `rating` is built from - every rating, not just the ones with words. */
  ratingCount: number | null
}

/** What the public reviews endpoint, and the block's server render, both work from. */
export interface ReviewsPayload {
  summary: PlaceSummary
  reviews: PublicReview[]
  /**
   * When the server read these (epoch milliseconds). "3 weeks ago" is measured
   * from here, so the server render and the browser that hydrates it agree.
   */
  readAt: number
}

/** One review as the settings tab lists it - everything, hidden or not. */
export interface AdminReview extends PublicReview {
  hidden: boolean
  firstSeenAt: string
  lastSeenAt: string
}

/** The settings tab's view of the module. The API key itself never leaves the server. */
export interface AdminSettings {
  hasApiKey: boolean
  placeId: string
  minRating: number
  requireText: boolean
  keepHistory: boolean
  lastFetchedAt: string | null
  lastError: string | null
  summary: PlaceSummary
}

/** A business found by the "find your business" search. */
export interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
  rating: number | null
  ratingCount: number | null
}

export const MIN_RATING_FLOOR = 1
export const MAX_RATING = 5

/** Clamps anything to a whole star count between 1 and 5, defaulting to 1 (show everything). */
export function normaliseMinRating(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return MIN_RATING_FLOOR
  return Math.min(MAX_RATING, Math.max(MIN_RATING_FLOOR, Math.round(parsed)))
}

// Google's place IDs are URL-safe base64-ish tokens, usually starting "ChIJ" but
// not always. Anything else pasted into the box - a whole Maps link, a business
// name - is refused here rather than sent to Google as a path segment.
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,300}$/

/** A trimmed place ID, or null when the value cannot be one. */
export function normalisePlaceId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return PLACE_ID_PATTERN.test(trimmed) ? trimmed : null
}

/** Google's "leave us a review" page for a place. */
export function writeReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
}
