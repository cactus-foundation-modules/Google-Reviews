// The static pieces of the Google Reviews block: stars, a review card, the
// header and the footer links. No hooks and no browser APIs, so the moving
// layouts (ReviewsDisplay) and the still ones draw exactly the same card.

import type { ReactElement } from 'react'
import type { PlaceSummary, PublicReview } from '@/modules/google-reviews/lib/types'
import { writeReviewUrl } from '@/modules/google-reviews/lib/types'
import { absoluteDateLabel, relativeTimeLabel, type DisplayConfig } from '@/modules/google-reviews/lib/display'

const STAR_PATH = 'M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z'

function StarRow({ variant }: { variant: 'empty' | 'filled' }): ReactElement {
  return (
    <span className={`grv__stars-row grv__stars-row--${variant}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((position) => (
        <svg key={position} viewBox="0 0 24 24" focusable="false">
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      ))}
    </span>
  )
}

/** Five stars, filled to `rating` (fractions allowed), with a spoken equivalent. */
export function Stars({ rating }: { rating: number }): ReactElement {
  const bounded = Math.min(5, Math.max(0, rating))
  const spoken = Number.isInteger(bounded) ? String(bounded) : bounded.toFixed(1)
  return (
    <span className="grv__stars" role="img" aria-label={`Rated ${spoken} out of 5`}>
      <StarRow variant="empty" />
      <span className="grv__stars-row grv__stars-row--filled" style={{ width: `${(bounded / 5) * 100}%` }} aria-hidden="true">
        <StarRow variant="filled" />
      </span>
    </span>
  )
}

function dateLabel(review: PublicReview, config: DisplayConfig, now: number): string {
  if (config.dateDisplay === 'none') return ''
  if (config.dateDisplay === 'date') return absoluteDateLabel(review.publishedAt) || (review.relativeTime ?? '')
  return relativeTimeLabel(review.publishedAt, review.relativeTime, now)
}

function AuthorPhoto({ review }: { review: PublicReview }): ReactElement {
  if (review.authorPhotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a 40px Google-hosted avatar; routing it through the image optimiser costs a function call for nothing
      <img
        className="grv__photo"
        src={review.authorPhotoUrl}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    )
  }
  const initial = review.authorName.trim().charAt(0).toUpperCase() || '?'
  return <span className="grv__photo grv__photo--initial" aria-hidden="true">{initial}</span>
}

export function ReviewCard({ review, config, now }: { review: PublicReview; config: DisplayConfig; now: number }): ReactElement {
  const when = dateLabel(review, config, now)
  const meta = [when, config.showSource ? 'Posted on Google' : ''].filter(Boolean).join(' · ')
  return (
    <article className="grv__card">
      {config.showQuoteMark && <span className="grv__quote" aria-hidden="true">&ldquo;</span>}
      <Stars rating={review.rating} />
      {review.text && <p className="grv__text">{review.text}</p>}
      <div className="grv__author">
        {config.showAuthorPhoto && <AuthorPhoto review={review} />}
        <div className="grv__who">
          {review.authorUrl ? (
            <a className="grv__name" href={review.authorUrl} target="_blank" rel="noopener noreferrer nofollow">{review.authorName}</a>
          ) : (
            <span className="grv__name">{review.authorName}</span>
          )}
          {meta && <span className="grv__meta">{meta}</span>}
        </div>
      </div>
      {config.linkCards && review.reviewUrl && (
        <a className="grv__card-link" href={review.reviewUrl} target="_blank" rel="noopener noreferrer nofollow">
          Read on Google<span className="sr-only"> - review by {review.authorName}</span>
        </a>
      )}
    </article>
  )
}

function ratingCountLabel(count: number | null): string {
  if (count === null) return 'on Google'
  return `from ${count.toLocaleString('en-GB')} Google ${count === 1 ? 'review' : 'reviews'}`
}

export function ReviewsHeader({ config, summary }: { config: DisplayConfig; summary: PlaceSummary }): ReactElement | null {
  const HeadingTag = config.headingTag
  const showSummary = config.showSummary && summary.rating !== null
  if (!config.heading && !config.intro && !showSummary) return null
  return (
    <header className={`grv__header grv__header--${config.headerAlign}`}>
      {config.heading && (
        <HeadingTag className="grv__heading" style={config.headingFont ? { fontFamily: config.headingFont } : undefined}>
          {config.heading}
        </HeadingTag>
      )}
      {config.intro && <p className="grv__intro">{config.intro}</p>}
      {showSummary && summary.rating !== null && (
        <div className="grv__summary">
          <span className="grv__summary-score" style={config.ratingFont ? { fontFamily: config.ratingFont } : undefined}>
            {summary.rating.toFixed(1)}
          </span>
          <Stars rating={summary.rating} />
          {config.showRatingCount && <span className="grv__summary-count">{ratingCountLabel(summary.ratingCount)}</span>}
        </div>
      )}
    </header>
  )
}

export function ReviewsBadge({ config, summary }: { config: DisplayConfig; summary: PlaceSummary }): ReactElement | null {
  if (summary.rating === null) return null
  const content = (
    <>
      <span className="grv__badge-score" style={config.ratingFont ? { fontFamily: config.ratingFont } : undefined}>
        {summary.rating.toFixed(1)}
      </span>
      <Stars rating={summary.rating} />
      {config.showRatingCount && <span className="grv__badge-count">{ratingCountLabel(summary.ratingCount)}</span>}
    </>
  )
  return summary.mapsUrl ? (
    <a className="grv__badge" href={summary.mapsUrl} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    <div className="grv__badge">{content}</div>
  )
}

export function ReviewsFooter({ config, summary }: { config: DisplayConfig; summary: PlaceSummary }): ReactElement | null {
  const googleLink = config.showGoogleLink && summary.mapsUrl ? summary.mapsUrl : null
  const writeLink = config.showWriteReview && summary.placeId ? writeReviewUrl(summary.placeId) : null
  if (!googleLink && !writeLink) return null
  return (
    <div className="grv__footer">
      {googleLink && (
        <a className="grv__footer-link" href={googleLink} target="_blank" rel="noopener noreferrer">{config.googleLinkLabel}</a>
      )}
      {writeLink && (
        <a className="grv__footer-link" href={writeLink} target="_blank" rel="noopener noreferrer">{config.writeReviewLabel}</a>
      )}
    </div>
  )
}
