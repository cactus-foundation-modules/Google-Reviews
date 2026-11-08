// One pull from Google, start to finish. Shared by the nightly job and the
// settings tab's "Fetch reviews now" button, so both behave identically.

import { fetchPlaceWithReviews, GooglePlacesError } from '@/modules/google-reviews/lib/google-places'
import { getApiKey, getPlaceId, recordFetchError, saveFetchedPlace } from '@/modules/google-reviews/lib/store'

export type RefreshResult =
  | { ok: true; reviewCount: number }
  | { ok: false; skipped: boolean; error: string }

export async function refreshReviews(): Promise<RefreshResult> {
  const [apiKey, placeId] = await Promise.all([getApiKey(), getPlaceId()])
  // Not set up yet is not a failure worth recording: there is nothing to fix
  // until the owner has filled the settings in.
  if (!apiKey) return { ok: false, skipped: true, error: 'Add a Google API key first.' }
  if (!placeId) return { ok: false, skipped: true, error: 'Choose your business first.' }

  try {
    const place = await fetchPlaceWithReviews(apiKey, placeId)
    await saveFetchedPlace(place)
    return { ok: true, reviewCount: place.reviews.length }
  } catch (error) {
    const message = error instanceof GooglePlacesError
      ? error.message
      : 'Something went wrong saving the reviews. The ones already on the site have been left alone.'
    if (!(error instanceof GooglePlacesError)) console.error('[google-reviews] refresh failed', error)
    await recordFetchError(message).catch((recordError: unknown) => {
      console.error('[google-reviews] could not record the failure', recordError)
    })
    return { ok: false, skipped: false, error: message }
  }
}
