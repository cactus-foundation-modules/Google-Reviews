// Talks to Google's Places API (New). Server only - the API key is a secret.
//
// Two calls, both validated with Zod on the way in, because a response we have
// not checked is a response we are trusting with the markup of somebody's site:
//   - place details, for the business summary and its reviews
//   - text search, for the settings tab's "find your business" box
//
// Google returns at most five reviews per place, chosen by its own idea of
// relevance. There is no paging and no way to ask for more; see keep_history in
// the migration for the owner's way round that.

import { z } from 'zod'
import type { PlaceSearchResult } from '@/modules/google-reviews/lib/types'

const PLACES_BASE_URL = 'https://places.googleapis.com/v1'
const REQUEST_TIMEOUT_MS = 15_000

const DETAILS_FIELD_MASK = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews'
const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'

const LocalisedTextSchema = z.object({
  text: z.string().optional(),
  languageCode: z.string().optional(),
})

const ReviewSchema = z.object({
  name: z.string().min(1),
  relativePublishTimeDescription: z.string().optional(),
  rating: z.number().optional(),
  text: LocalisedTextSchema.optional(),
  originalText: LocalisedTextSchema.optional(),
  authorAttribution: z
    .object({
      displayName: z.string().optional(),
      uri: z.string().optional(),
      photoUri: z.string().optional(),
    })
    .optional(),
  publishTime: z.string().optional(),
  googleMapsUri: z.string().optional(),
})

const PlaceDetailsSchema = z.object({
  id: z.string().optional(),
  displayName: LocalisedTextSchema.optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  googleMapsUri: z.string().optional(),
  reviews: z.array(ReviewSchema).optional(),
})

const SearchResponseSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: LocalisedTextSchema.optional(),
        formattedAddress: z.string().optional(),
        rating: z.number().optional(),
        userRatingCount: z.number().optional(),
      }),
    )
    .optional(),
})

const GoogleErrorSchema = z.object({
  error: z.object({
    code: z.number().optional(),
    message: z.string().optional(),
    status: z.string().optional(),
  }),
})

/** A review exactly as we keep it, cleaned of anything unsafe to put on a page. */
export interface FetchedReview {
  id: string
  authorName: string
  authorUrl: string | null
  authorPhotoUrl: string | null
  rating: number
  text: string
  languageCode: string | null
  publishedAt: Date | null
  relativeTime: string | null
  reviewUrl: string | null
}

export interface FetchedPlace {
  placeId: string
  name: string | null
  mapsUrl: string | null
  rating: number | null
  ratingCount: number | null
  reviews: FetchedReview[]
}

/** Something went wrong talking to Google. `message` is written for the site owner. */
export class GooglePlacesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GooglePlacesError'
  }
}

/**
 * An https URL, or null. Google's own links are always https; anything else
 * arriving in a field we put into an href or src is refused rather than trusted.
 * Google has been known to send photo links without a scheme ("//lh3..."), so
 * those are given one.
 */
export function safeHttpsUrl(value: string | undefined): string | null {
  if (!value) return null
  const withScheme = value.startsWith('//') ? `https:${value}` : value
  try {
    const parsed = new URL(withScheme)
    return parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function clampStars(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  return rounded >= 1 && rounded <= 5 ? rounded : null
}

function parsePublishTime(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toFetchedReview(review: z.infer<typeof ReviewSchema>): FetchedReview | null {
  const rating = clampStars(review.rating)
  // A review with no star rating cannot be filtered by stars or drawn with
  // them, so it is not a review this module can show.
  if (rating === null) return null
  // The original wording over Google's translation of it: a review is quoted,
  // and a quote should be what the person actually wrote.
  const body = review.originalText ?? review.text
  return {
    id: review.name,
    authorName: review.authorAttribution?.displayName?.trim() || 'A Google user',
    authorUrl: safeHttpsUrl(review.authorAttribution?.uri),
    authorPhotoUrl: safeHttpsUrl(review.authorAttribution?.photoUri),
    rating,
    text: body?.text?.trim() ?? '',
    languageCode: body?.languageCode ?? null,
    publishedAt: parsePublishTime(review.publishTime),
    relativeTime: review.relativePublishTimeDescription ?? null,
    reviewUrl: safeHttpsUrl(review.googleMapsUri),
  }
}

/**
 * Turns Google's error into something an owner can act on. Google's own wording
 * is kept on the end, because it is often the only clue to which switch in the
 * Cloud console is still off.
 */
function describeGoogleError(status: number, body: unknown): string {
  const parsed = GoogleErrorSchema.safeParse(body)
  const detail = parsed.success ? parsed.data.error.message : undefined
  const suffix = detail ? ` Google said: "${detail}"` : ''
  if (status === 400) return `Google did not recognise that request - usually a place ID that is not quite right.${suffix}`
  if (status === 401 || status === 403) {
    return `Google refused the API key. Check it is copied in full, that the Places API (New) is switched on for its project, and that billing is set up.${suffix}`
  }
  if (status === 404) return `Google could not find that business. Try finding it again with the search box.${suffix}`
  if (status === 429) return `Google says the API key has used its allowance for now. It will try again on the next scheduled pull.${suffix}`
  return `Google could not be reached properly (error ${status}).${suffix}`
}

async function callPlaces(url: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  } catch {
    throw new GooglePlacesError('Could not reach Google. It may be a passing network hiccup - try again in a minute.')
  }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new GooglePlacesError(describeGoogleError(response.status, body))
  return body
}

/** The business summary and up to five reviews for one place. */
export async function fetchPlaceWithReviews(apiKey: string, placeId: string): Promise<FetchedPlace> {
  const body = await callPlaces(`${PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': DETAILS_FIELD_MASK },
  })
  const parsed = PlaceDetailsSchema.safeParse(body)
  if (!parsed.success) throw new GooglePlacesError('Google answered, but not in a shape this module understands. Nothing was changed.')
  const place = parsed.data
  return {
    placeId,
    name: place.displayName?.text?.trim() || null,
    mapsUrl: safeHttpsUrl(place.googleMapsUri),
    rating: typeof place.rating === 'number' && Number.isFinite(place.rating) ? Math.round(place.rating * 10) / 10 : null,
    ratingCount: typeof place.userRatingCount === 'number' && Number.isFinite(place.userRatingCount) ? Math.max(0, Math.round(place.userRatingCount)) : null,
    reviews: (place.reviews ?? []).map(toFetchedReview).filter((review): review is FetchedReview => review !== null),
  }
}

/** Businesses on Google matching a name and town, for the owner to pick from. */
export async function searchPlaces(apiKey: string, query: string): Promise<PlaceSearchResult[]> {
  const body = await callPlaces(`${PLACES_BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    // Google leaves out businesses that hide their address (delivery-only shops,
    // mobile trades) unless asked for them, so a search for one by its exact
    // name comes back empty. Plenty of small businesses are exactly that.
    body: JSON.stringify({ textQuery: query, pageSize: 8, includePureServiceAreaBusinesses: true }),
  })
  const parsed = SearchResponseSchema.safeParse(body)
  if (!parsed.success) throw new GooglePlacesError('Google answered, but not in a shape this module understands.')
  return (parsed.data.places ?? []).map((place) => ({
    placeId: place.id,
    name: place.displayName?.text ?? 'Unnamed place',
    address: place.formattedAddress ?? '',
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
  }))
}
