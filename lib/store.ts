// Reads and writes the module's two tables. Server only.
//
// Repository pattern: every SQL statement this module runs lives in this file,
// so the routes and the block's server render talk in typed objects and never
// in rows.

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { encryptSecret, tryDecryptSecret } from '@/lib/crypto/secrets'
import type { FetchedPlace, FetchedReview } from '@/modules/google-reviews/lib/google-places'
import {
  normaliseMinRating,
  normalisePlaceId,
  type AdminReview,
  type AdminSettings,
  type PlaceSummary,
  type PublicReview,
  type ReviewsPayload,
} from '@/modules/google-reviews/lib/types'

interface SettingsRow {
  api_key_encrypted: string | null
  place_id: string | null
  place_name: string | null
  place_maps_url: string | null
  place_rating: Prisma.Decimal | number | null
  place_rating_count: number | null
  min_rating: number
  require_text: boolean
  keep_history: boolean
  last_fetched_at: Date | null
  last_error: string | null
}

interface ReviewRow {
  id: string
  author_name: string
  author_url: string | null
  author_photo_url: string | null
  rating: number
  text: string
  published_at: Date | null
  relative_time: string | null
  review_url: string | null
  hidden: boolean
  first_seen_at: Date
  last_seen_at: Date
}

const EMPTY_SUMMARY: PlaceSummary = { placeId: null, name: null, mapsUrl: null, rating: null, ratingCount: null }

async function readSettingsRow(): Promise<SettingsRow | null> {
  const rows = await prisma.$queryRaw<SettingsRow[]>`
    SELECT "api_key_encrypted", "place_id", "place_name", "place_maps_url", "place_rating",
           "place_rating_count", "min_rating", "require_text", "keep_history",
           "last_fetched_at", "last_error"
    FROM "grv_settings" WHERE "id" = 'singleton'
  `
  return rows[0] ?? null
}

// numeric arrives from a raw query as Prisma.Decimal, not a number.
function decimalToNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null
  const asNumber = typeof value === 'number' ? value : value.toNumber()
  return Number.isFinite(asNumber) ? asNumber : null
}

function summaryOf(row: SettingsRow | null): PlaceSummary {
  if (!row) return EMPTY_SUMMARY
  return {
    placeId: row.place_id,
    name: row.place_name,
    mapsUrl: row.place_maps_url,
    rating: decimalToNumber(row.place_rating),
    ratingCount: row.place_rating_count,
  }
}

function toPublicReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    authorName: row.author_name,
    authorUrl: row.author_url,
    authorPhotoUrl: row.author_photo_url,
    rating: row.rating,
    text: row.text,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    relativeTime: row.relative_time,
    reviewUrl: row.review_url,
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getAdminSettings(): Promise<AdminSettings> {
  const row = await readSettingsRow()
  return {
    hasApiKey: !!row?.api_key_encrypted,
    placeId: row?.place_id ?? '',
    minRating: normaliseMinRating(row?.min_rating),
    requireText: row?.require_text ?? false,
    keepHistory: row?.keep_history ?? false,
    lastFetchedAt: row?.last_fetched_at ? row.last_fetched_at.toISOString() : null,
    lastError: row?.last_error ?? null,
    summary: summaryOf(row),
  }
}

/**
 * The decrypted API key, or null. tryDecryptSecret rather than decryptSecret: a
 * restored backup can carry ciphertext written under another install's key, and
 * "this install cannot read that" is a missing key, not a crash.
 */
export async function getApiKey(): Promise<string | null> {
  const row = await readSettingsRow()
  return tryDecryptSecret(row?.api_key_encrypted ?? null)
}

export async function getPlaceId(): Promise<string | null> {
  const row = await readSettingsRow()
  return normalisePlaceId(row?.place_id)
}

export interface SettingsPatch {
  apiKey?: string
  clearApiKey?: boolean
  placeId?: string
  minRating?: number
  requireText?: boolean
  keepHistory?: boolean
}

export async function updateSettings(patch: SettingsPatch): Promise<void> {
  // One column at a time: every value is optional, and a tagged template cannot
  // assemble a SET list without giving up the parameterisation that keeps it safe.
  await prisma.$executeRaw`INSERT INTO "grv_settings" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING`

  if (patch.clearApiKey) {
    await prisma.$executeRaw`UPDATE "grv_settings" SET "api_key_encrypted" = NULL, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = 'singleton'`
  } else if (patch.apiKey && patch.apiKey.trim()) {
    const encrypted = encryptSecret(patch.apiKey.trim())
    await prisma.$executeRaw`UPDATE "grv_settings" SET "api_key_encrypted" = ${encrypted}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = 'singleton'`
  }

  if (patch.placeId !== undefined) {
    const placeId = normalisePlaceId(patch.placeId)
    const current = await getPlaceId()
    if (placeId !== current) {
      // A different business: everything known about the old one goes, so its
      // reviews can never turn up under the new one's name.
      await prisma.$transaction([
        prisma.$executeRaw`DELETE FROM "grv_reviews"`,
        prisma.$executeRaw`
          UPDATE "grv_settings"
          SET "place_id" = ${placeId}, "place_name" = NULL, "place_maps_url" = NULL,
              "place_rating" = NULL, "place_rating_count" = NULL, "last_fetched_at" = NULL,
              "last_error" = NULL, "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = 'singleton'
        `,
      ])
    }
  }

  if (patch.minRating !== undefined) {
    const minRating = normaliseMinRating(patch.minRating)
    await prisma.$executeRaw`UPDATE "grv_settings" SET "min_rating" = ${minRating}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = 'singleton'`
  }
  if (patch.requireText !== undefined) {
    await prisma.$executeRaw`UPDATE "grv_settings" SET "require_text" = ${patch.requireText}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = 'singleton'`
  }
  if (patch.keepHistory !== undefined) {
    await prisma.$executeRaw`UPDATE "grv_settings" SET "keep_history" = ${patch.keepHistory}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = 'singleton'`
  }
}

// ---------------------------------------------------------------------------
// A pull from Google
// ---------------------------------------------------------------------------

function upsertReview(placeId: string, review: FetchedReview): Prisma.PrismaPromise<number> {
  return prisma.$executeRaw`
    INSERT INTO "grv_reviews" (
      "id", "place_id", "author_name", "author_url", "author_photo_url", "rating", "text",
      "language_code", "published_at", "relative_time", "review_url", "first_seen_at", "last_seen_at"
    ) VALUES (
      ${review.id}, ${placeId}, ${review.authorName}, ${review.authorUrl}, ${review.authorPhotoUrl},
      ${review.rating}, ${review.text}, ${review.languageCode}, ${review.publishedAt},
      ${review.relativeTime}, ${review.reviewUrl}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "place_id" = EXCLUDED."place_id",
      "author_name" = EXCLUDED."author_name",
      "author_url" = EXCLUDED."author_url",
      "author_photo_url" = EXCLUDED."author_photo_url",
      "rating" = EXCLUDED."rating",
      "text" = EXCLUDED."text",
      "language_code" = EXCLUDED."language_code",
      "published_at" = EXCLUDED."published_at",
      "relative_time" = EXCLUDED."relative_time",
      "review_url" = EXCLUDED."review_url",
      "last_seen_at" = CURRENT_TIMESTAMP
  `
}

/**
 * Stores a successful pull: the business summary, every review Google sent,
 * and - unless the owner keeps history - lets go of the reviews it did not.
 * One transaction, so a visitor never sees half of one pull and half of another.
 */
export async function saveFetchedPlace(place: FetchedPlace): Promise<void> {
  const row = await readSettingsRow()
  const keepHistory = row?.keep_history ?? false
  const keptIds = place.reviews.map((review) => review.id)

  const statements: Prisma.PrismaPromise<number>[] = [
    // Anything left over from another business goes whatever the history setting says.
    prisma.$executeRaw`DELETE FROM "grv_reviews" WHERE "place_id" <> ${place.placeId}`,
    ...place.reviews.map((review) => upsertReview(place.placeId, review)),
  ]
  if (!keepHistory) {
    statements.push(
      keptIds.length > 0
        ? prisma.$executeRaw`DELETE FROM "grv_reviews" WHERE "place_id" = ${place.placeId} AND "id" <> ALL(${keptIds}::text[])`
        : prisma.$executeRaw`DELETE FROM "grv_reviews" WHERE "place_id" = ${place.placeId}`,
    )
  }
  statements.push(prisma.$executeRaw`
    UPDATE "grv_settings"
    SET "place_name" = ${place.name}, "place_maps_url" = ${place.mapsUrl},
        "place_rating" = ${place.rating}, "place_rating_count" = ${place.ratingCount},
        "last_fetched_at" = CURRENT_TIMESTAMP, "last_error" = NULL, "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = 'singleton'
  `)
  await prisma.$transaction(statements)
}

/** Records why a pull failed. The reviews already stored stay where they are. */
export async function recordFetchError(message: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "grv_settings" SET "last_error" = ${message.slice(0, 1000)}, "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = 'singleton'
  `
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function listAdminReviews(): Promise<AdminReview[]> {
  const rows = await prisma.$queryRaw<ReviewRow[]>`
    SELECT "id", "author_name", "author_url", "author_photo_url", "rating", "text", "published_at",
           "relative_time", "review_url", "hidden", "first_seen_at", "last_seen_at"
    FROM "grv_reviews"
    ORDER BY "published_at" DESC NULLS LAST, "first_seen_at" DESC
  `
  return rows.map((row) => ({
    ...toPublicReview(row),
    hidden: row.hidden,
    firstSeenAt: row.first_seen_at.toISOString(),
    lastSeenAt: row.last_seen_at.toISOString(),
  }))
}

/** True when a review with that id existed to be changed. */
export async function setReviewHidden(reviewId: string, hidden: boolean): Promise<boolean> {
  const changed = await prisma.$executeRaw`UPDATE "grv_reviews" SET "hidden" = ${hidden} WHERE "id" = ${reviewId}`
  return changed > 0
}

/**
 * Everything a visitor may see: the business summary and the reviews that pass
 * the site-wide rules (not hidden, at or above the star floor, words if words
 * are required). A block narrows this further; it can never widen it.
 *
 * Fails soft to an empty payload: a block on a page must never take the page
 * down because this module's tables are missing or the database blinked.
 */
export async function getPublicPayload(): Promise<ReviewsPayload> {
  try {
    const row = await readSettingsRow()
    if (!row) return { summary: EMPTY_SUMMARY, reviews: [], readAt: Date.now() }
    const minRating = normaliseMinRating(row.min_rating)
    const rows = await prisma.$queryRaw<ReviewRow[]>`
      SELECT "id", "author_name", "author_url", "author_photo_url", "rating", "text", "published_at",
             "relative_time", "review_url", "hidden", "first_seen_at", "last_seen_at"
      FROM "grv_reviews"
      WHERE "hidden" = false
        AND "rating" >= ${minRating}
        AND (${row.require_text} = false OR length(btrim("text")) > 0)
      ORDER BY "published_at" DESC NULLS LAST, "first_seen_at" DESC
    `
    return { summary: summaryOf(row), reviews: rows.map(toPublicReview), readAt: Date.now() }
  } catch (error) {
    console.error('[google-reviews] could not read reviews', error)
    return { summary: EMPTY_SUMMARY, reviews: [], readAt: Date.now() }
  }
}
