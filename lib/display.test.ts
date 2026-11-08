import { describe, it, expect } from 'vitest'
import { relativeTimeLabel, safeColour, selectReviews, toDisplayConfig } from './display'
import type { PublicReview } from './types'

function review(id: string, rating: number, text: string, publishedAt: string | null): PublicReview {
  return { id, authorName: id, authorUrl: null, authorPhotoUrl: null, rating, text, publishedAt, relativeTime: null, reviewUrl: null }
}

const REVIEWS: PublicReview[] = [
  review('old-five', 5, 'Lovely', '2025-01-01T00:00:00Z'),
  review('new-three', 3, 'Fine', '2026-06-01T00:00:00Z'),
  review('mid-four', 4, '', '2026-01-01T00:00:00Z'),
  review('new-one', 1, 'Dreadful', '2026-07-01T00:00:00Z'),
]

describe('selectReviews', () => {
  it('hides reviews under the block star floor', () => {
    const config = toDisplayConfig({ minRating: '4', requireText: 'no' })
    expect(selectReviews(REVIEWS, config).map((r) => r.id)).toEqual(['mid-four', 'old-five'])
  })

  it('leaves the floor to the site setting when the block says so', () => {
    const config = toDisplayConfig({ minRating: 'site', requireText: 'no' })
    expect(selectReviews(REVIEWS, config)).toHaveLength(4)
  })

  it('drops star-only reviews when words are required', () => {
    const config = toDisplayConfig({ minRating: 'site', requireText: 'yes' })
    expect(selectReviews(REVIEWS, config).map((r) => r.id)).not.toContain('mid-four')
  })

  it('sorts highest first, newest breaking ties, and caps the count', () => {
    const config = toDisplayConfig({ sortBy: 'highest', requireText: 'no', maxReviews: 2 })
    expect(selectReviews(REVIEWS, config).map((r) => r.id)).toEqual(['old-five', 'mid-four'])
  })
})

describe('toDisplayConfig', () => {
  it('falls back to safe defaults for nonsense', () => {
    const config = toDisplayConfig({ display: 'hologram', columns: 99, interval: -4 })
    expect(config.display).toBe('carousel')
    expect(config.intervalMs).toBe(2000)
    expect((config.style as Record<string, string>)['--grv-cols']).toBe('6')
  })

  it('carries a light-dark colour pair through to its custom property', () => {
    const config = toDisplayConfig({ cardBgColor: 'light-dark(var(--color-1), var(--color-2))' })
    expect((config.style as Record<string, string>)['--grv-card-bg']).toBe('light-dark(var(--color-1), var(--color-2))')
  })
})

describe('safeColour', () => {
  it('refuses anything that could write a declaration of its own', () => {
    expect(safeColour('red; background: url(x)')).toBeNull()
    expect(safeColour('url(https://example.com/x.png)')).toBeNull()
    expect(safeColour('</style>')).toBeNull()
  })

  it('accepts ordinary colour values', () => {
    expect(safeColour('var(--color-3)')).toBe('var(--color-3)')
    expect(safeColour('rgb(0 0 0 / 50%)')).toBe('rgb(0 0 0 / 50%)')
  })
})

describe('relativeTimeLabel', () => {
  const now = Date.parse('2026-11-08T12:00:00Z')

  it('counts back from now', () => {
    expect(relativeTimeLabel('2026-11-01T12:00:00Z', null, now)).toBe('1 week ago')
    expect(relativeTimeLabel('2026-11-06T12:00:00Z', null, now)).toBe('2 days ago')
    expect(relativeTimeLabel('2024-11-01T12:00:00Z', null, now)).toBe('2 years ago')
  })

  it('falls back to Google\'s own phrase without a date', () => {
    expect(relativeTimeLabel(null, 'a month ago', now)).toBe('a month ago')
  })
})
