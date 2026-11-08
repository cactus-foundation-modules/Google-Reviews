'use client'

// The block as the page editor shows it: the same display the live page draws,
// fed from the public reviews endpoint instead of straight from the database.
// Until the module is set up it shows three made-up reviews, clearly labelled,
// so an owner can design the block before Google has sent anything.

import { useEffect, useState, type ReactElement } from 'react'
import { SharedStyle } from '@/components/SharedStyle'
import { reviewsCss } from '@/modules/google-reviews/components/public/reviews-css'
import { ReviewsDisplay } from '@/modules/google-reviews/components/public/ReviewsDisplay'
import { blockFontHrefs, toDisplayConfig, type GoogleReviewsBlockProps } from '@/modules/google-reviews/lib/display'
import type { ReviewsPayload } from '@/modules/google-reviews/lib/types'

const DAY = 24 * 60 * 60 * 1000

function samplePayload(now: number): ReviewsPayload {
  const daysAgo = (days: number) => new Date(now - days * DAY).toISOString()
  const sample = (id: string, authorName: string, rating: number, text: string, days: number) => ({
    id, authorName, rating, text,
    authorUrl: null, authorPhotoUrl: null, publishedAt: daysAgo(days), relativeTime: null, reviewUrl: null,
  })
  return {
    readAt: now,
    summary: { placeId: null, name: 'Your business', mapsUrl: null, rating: 4.8, ratingCount: 127 },
    reviews: [
      sample('sample-1', 'Alex P.', 5, 'Ordered on Monday, arrived on Wednesday, and the chap who delivered it even took the packaging away. Faultless.', 4),
      sample('sample-2', 'Sam R.', 5, 'Friendly, quick to answer questions and the quality is better than the photos suggest, which is a rare thing.', 12),
      sample('sample-3', 'Jo M.', 4, 'Very pleased overall. One part was missing, but a replacement turned up the next day without any fuss.', 30),
      sample('sample-4', 'Chris T.', 5, 'Third order now and every one has been spot on. Will be back for a fourth.', 45),
    ],
  }
}

// One fetch shared by every Google Reviews block in the editor, refreshed at
// most once a minute, so typing in the sidebar never refetches.
let cached: { payload: ReviewsPayload; expires: number } | null = null
let inFlight: Promise<ReviewsPayload | null> | null = null

function loadPayload(): Promise<ReviewsPayload | null> {
  if (cached && Date.now() < cached.expires) return Promise.resolve(cached.payload)
  if (!inFlight) {
    inFlight = fetch('/api/m/google-reviews/public/reviews')
      .then((response) => (response.ok ? (response.json() as Promise<ReviewsPayload>) : null))
      .then((payload) => {
        if (payload) cached = { payload, expires: Date.now() + 60_000 }
        return payload
      })
      .catch(() => null)
      .finally(() => { inFlight = null })
  }
  return inFlight
}

export function GoogleReviewsEditorPreview(props: GoogleReviewsBlockProps): ReactElement {
  const [payload, setPayload] = useState<ReviewsPayload | null>(cached?.payload ?? null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    void loadPayload().then((loaded) => {
      if (!cancelled && loaded) setPayload(loaded)
    })
    return () => { cancelled = true }
  }, [])

  const config = toDisplayConfig(props)
  const hasReal = !!payload && (payload.reviews.length > 0 || payload.summary.rating !== null)
  const shown = hasReal && payload ? payload : samplePayload(now)
  const notice = hasReal
    ? undefined
    : 'Sample reviews for designing with. Your own appear once the module is set up under Settings, Google Reviews.'

  return (
    <>
      <SharedStyle id="google-reviews" css={reviewsCss()} />
      {blockFontHrefs(config).map((href) => <link key={href} rel="stylesheet" href={href} />)}
      <ReviewsDisplay config={config} payload={shown} notice={notice} />
    </>
  )
}
