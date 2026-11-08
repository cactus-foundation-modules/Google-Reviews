import { afterEach, describe, it, expect, vi } from 'vitest'
import { fetchPlaceWithReviews, GooglePlacesError, safeHttpsUrl } from './google-places'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

describe('safeHttpsUrl', () => {
  it('gives a scheme to protocol-relative photo links', () => {
    expect(safeHttpsUrl('//lh3.googleusercontent.com/a/abc')).toBe('https://lh3.googleusercontent.com/a/abc')
  })

  it('refuses anything that is not https', () => {
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpsUrl('http://example.com')).toBeNull()
    expect(safeHttpsUrl('not a url')).toBeNull()
  })
})

describe('fetchPlaceWithReviews', () => {
  it('maps Google\'s answer and drops reviews it cannot draw', async () => {
    stubFetch(200, {
      id: 'ChIJabc',
      displayName: { text: 'The Shop', languageCode: 'en' },
      rating: 4.66,
      userRatingCount: 212,
      googleMapsUri: 'https://maps.google.com/?cid=1',
      reviews: [
        {
          name: 'places/ChIJabc/reviews/one',
          rating: 5,
          text: { text: 'Translated', languageCode: 'en' },
          originalText: { text: '  Original words  ', languageCode: 'cy' },
          authorAttribution: { displayName: 'Rhian', uri: 'https://www.google.com/maps/contrib/1', photoUri: '//lh3.googleusercontent.com/a/x' },
          publishTime: '2026-10-01T10:00:00Z',
        },
        { name: 'places/ChIJabc/reviews/two', text: { text: 'No stars' } },
        { name: 'places/ChIJabc/reviews/three', rating: 2, authorAttribution: { uri: 'javascript:alert(1)' } },
      ],
    })
    const place = await fetchPlaceWithReviews('key', 'ChIJabc')
    expect(place.name).toBe('The Shop')
    expect(place.rating).toBe(4.7)
    expect(place.ratingCount).toBe(212)
    expect(place.reviews).toHaveLength(2)
    expect(place.reviews[0]).toMatchObject({
      text: 'Original words',
      languageCode: 'cy',
      authorPhotoUrl: 'https://lh3.googleusercontent.com/a/x',
    })
    expect(place.reviews[1]).toMatchObject({ authorName: 'A Google user', authorUrl: null, text: '' })
  })

  it('explains a refused key in plain English', async () => {
    stubFetch(403, { error: { code: 403, message: 'API key not valid.', status: 'PERMISSION_DENIED' } })
    await expect(fetchPlaceWithReviews('bad', 'ChIJabc')).rejects.toThrow(GooglePlacesError)
    await expect(fetchPlaceWithReviews('bad', 'ChIJabc')).rejects.toThrow(/refused the API key/)
  })
})
