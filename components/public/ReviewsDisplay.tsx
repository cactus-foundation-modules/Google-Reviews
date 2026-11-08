'use client'

// The Google Reviews block as a visitor sees it. One component draws every
// layout, and both halves of the block render it - the server with reviews read
// from the database, the editor with reviews fetched from the public endpoint -
// so the markup cannot drift between the two.
//
// Only the carousel, spotlight and ticker move, and only they hold state. Every
// moving layout has a pause button: anything that moves for more than five
// seconds needs one (WCAG 2.2.2), and a visitor who has asked their device for
// reduced motion starts paused.

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactElement, type RefObject, type TransitionEvent } from 'react'
import type { PublicReview, ReviewsPayload } from '@/modules/google-reviews/lib/types'
import { selectReviews, type DisplayConfig } from '@/modules/google-reviews/lib/display'
import { ReviewCard, ReviewsBadge, ReviewsFooter, ReviewsHeader } from '@/modules/google-reviews/components/public/ReviewParts'

export interface ReviewsDisplayProps {
  config: DisplayConfig
  payload: ReviewsPayload
  /** A note above the reviews, editor only - e.g. "these are sample reviews". */
  notice?: string
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }): ReactElement {
  return (
    <button type="button" className="grv__pause" onClick={onToggle} aria-label={paused ? 'Play reviews' : 'Pause reviews'}>
      {paused ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg>
      )}
    </button>
  )
}

function ArrowButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }): ReactElement {
  return (
    <button
      type="button"
      className={`grv__arrow grv__arrow--${direction}`}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous review' : 'Next review'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d={direction === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/** The cards-per-view the stylesheet settled on at this width. */
function readPerView(element: HTMLElement | null, fallback: number): number {
  if (!element) return fallback
  const value = Number.parseInt(getComputedStyle(element).getPropertyValue('--grv-per-view'), 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function initialPerView(config: DisplayConfig): number {
  if (config.display === 'spotlight') return 1
  const fromStyle = Number.parseInt(String((config.style as Record<string, string>)['--grv-cols'] ?? ''), 10)
  return Number.isFinite(fromStyle) && fromStyle > 0 ? fromStyle : 3
}

/**
 * Slides right to left. The first `perView` reviews are repeated after the last
 * so the track can keep moving the same way; on reaching the copies it jumps,
 * with the transition off, back to the identical position at the start.
 */
function Carousel({ reviews, config, now, rootRef }: {
  reviews: PublicReview[]
  config: DisplayConfig
  now: number
  rootRef: RefObject<HTMLElement | null>
}): ReactElement {
  const count = reviews.length
  const [perView, setPerView] = useState(() => initialPerView(config))
  const [index, setIndex] = useState(0)
  const [jumping, setJumping] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const pendingTarget = useRef<number | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const pageVisible = usePageVisible()

  const scrollable = count > perView
  const paused = userPaused || reducedMotion
  const playing = config.autoScroll && scrollable && !paused && !hoverPaused && pageVisible

  // The stylesheet decides how many cards fit; follow it as the block resizes.
  useEffect(() => {
    const element = rootRef.current
    if (!element) return
    const update = () => setPerView(readPerView(element, initialPerView(config)))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootRef, config])

  // A change in how many fit, or how many there are, starts again from the top.
  // Adjusted during render rather than in an effect, so the stale position is
  // never painted first.
  const layoutKey = `${perView}:${count}`
  const [seenLayoutKey, setSeenLayoutKey] = useState(layoutKey)
  if (seenLayoutKey !== layoutKey) {
    setSeenLayoutKey(layoutKey)
    setJumping(true)
    setIndex(0)
  }

  // After a jump, wait two frames for the browser to paint the new position,
  // then switch the transition back on (and finish a pending backwards step).
  useEffect(() => {
    if (!jumping) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        setJumping(false)
        if (pendingTarget.current !== null) {
          setIndex(pendingTarget.current)
          pendingTarget.current = null
        }
      })
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [jumping])

  const goTo = useCallback((target: number) => {
    if (!scrollable) return
    // With no transition there is no transitionend to tidy up after, so wrap now.
    if (reducedMotion) {
      setIndex(((target % count) + count) % count)
      return
    }
    setIndex(target)
  }, [count, reducedMotion, scrollable])

  const next = useCallback(() => goTo(index + 1), [goTo, index])

  const previous = useCallback(() => {
    if (!scrollable) return
    if (index > 0 || reducedMotion) {
      goTo(index - 1)
      return
    }
    // At the start: jump to the copies at the end, which look identical, then step back.
    pendingTarget.current = count - 1
    setJumping(true)
    setIndex(count)
  }, [count, goTo, index, reducedMotion, scrollable])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(next, config.intervalMs)
    return () => window.clearTimeout(timer)
  }, [playing, next, config.intervalMs, index])

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (index >= count) {
      setJumping(true)
      setIndex(index - count)
    }
  }

  const slides = scrollable ? [...reviews, ...reviews.slice(0, perView)] : reviews
  const activeDot = count > 0 ? index % count : 0
  const hoverHandlers = config.pauseOnHover
    ? {
        onMouseEnter: () => setHoverPaused(true),
        onMouseLeave: () => setHoverPaused(false),
        onFocus: () => setHoverPaused(true),
        onBlur: (event: FocusEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoverPaused(false)
        },
      }
    : {}
  const arrowsAtSides = config.showArrows && scrollable && config.controlsPosition === 'sides'
  const arrowsBelow = config.showArrows && scrollable && config.controlsPosition === 'below'
  const showControls = scrollable && (arrowsBelow || config.showDots || config.autoScroll)

  return (
    <div className="grv__carousel-wrap" role="region" aria-roledescription="carousel" aria-label="Customer reviews" {...hoverHandlers}>
      <div className={`grv__carousel${arrowsAtSides ? ' grv__carousel--sides' : ''}`}>
        {arrowsAtSides && <ArrowButton direction="prev" onClick={previous} />}
        <div className="grv__viewport" aria-live={playing ? 'off' : 'polite'}>
          <div
            className={`grv__track${jumping ? ' is-jumping' : ''}`}
            style={{ ['--grv-index' as string]: String(index) }}
            onTransitionEnd={onTransitionEnd}
          >
            {slides.map((review, position) => {
              const isCopy = position >= count
              return (
                <div
                  key={`${review.id}-${isCopy ? 'copy' : 'main'}`}
                  className="grv__slide"
                  role={isCopy ? undefined : 'group'}
                  aria-roledescription={isCopy ? undefined : 'slide'}
                  aria-label={isCopy ? undefined : `${position + 1} of ${count}`}
                  aria-hidden={isCopy || undefined}
                  inert={isCopy || undefined}
                >
                  <ReviewCard review={review} config={config} now={now} />
                </div>
              )
            })}
          </div>
        </div>
        {arrowsAtSides && <ArrowButton direction="next" onClick={next} />}
      </div>
      {showControls && (
        <div className="grv__controls">
          {arrowsBelow && <ArrowButton direction="prev" onClick={previous} />}
          {config.showDots && (
            <div className="grv__dots">
              {reviews.map((review, position) => (
                <button
                  key={review.id}
                  type="button"
                  className="grv__dot"
                  aria-label={`Show review ${position + 1}`}
                  aria-current={position === activeDot ? 'true' : undefined}
                  onClick={() => goTo(position)}
                />
              ))}
            </div>
          )}
          {config.autoScroll && <PauseButton paused={paused} onToggle={() => setUserPaused(!paused)} />}
          {arrowsBelow && <ArrowButton direction="next" onClick={next} />}
        </div>
      )}
    </div>
  )
}

/** A continuous strip, sliding right to left at a steady pace. */
function Ticker({ reviews, config, now }: { reviews: PublicReview[]; config: DisplayConfig; now: number }): ReactElement {
  const [userPaused, setUserPaused] = useState(false)
  return (
    <div role="region" aria-label="Customer reviews">
      <div className={`grv__ticker${userPaused ? ' is-paused' : ''}`}>
        <div className="grv__ticker-track">
          {[...reviews, ...reviews].map((review, position) => {
            const isCopy = position >= reviews.length
            return (
              <div
                key={`${review.id}-${isCopy ? 'copy' : 'main'}`}
                className="grv__slide"
                aria-hidden={isCopy || undefined}
                inert={isCopy || undefined}
              >
                <ReviewCard review={review} config={config} now={now} />
              </div>
            )
          })}
        </div>
      </div>
      <div className="grv__controls">
        <PauseButton paused={userPaused} onToggle={() => setUserPaused(!userPaused)} />
      </div>
    </div>
  )
}

function rootClassName(config: DisplayConfig): string {
  return [
    'grv',
    `grv--${config.display}`,
    `grv--card-${config.cardStyle}`,
    config.cardShadow !== 'none' ? `grv--shadow-${config.cardShadow}` : '',
    `grv--text-${config.textSize}`,
    `grv--head-${config.headingSize}`,
    `grv--photo-${config.photoShape}`,
    `grv--align-${config.contentAlign}`,
    config.equalHeight ? 'grv--equal' : '',
    config.italic ? 'grv--italic' : '',
    config.lineClamp > 0 ? 'grv--clamp' : '',
    config.pauseOnHover ? 'grv--pause-hover' : '',
  ].filter(Boolean).join(' ')
}

function ReviewsBody({ reviews, config, now, rootRef }: {
  reviews: PublicReview[]
  config: DisplayConfig
  now: number
  rootRef: RefObject<HTMLElement | null>
}): ReactElement {
  switch (config.display) {
    case 'carousel':
    case 'spotlight':
      return <Carousel reviews={reviews} config={config} now={now} rootRef={rootRef} />
    case 'ticker':
      return <Ticker reviews={reviews} config={config} now={now} />
    case 'masonry':
      return (
        <div className="grv__masonry">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} config={config} now={now} />)}
        </div>
      )
    case 'grid':
    case 'list':
    case 'badge':
      return (
        <div className="grv__grid">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} config={config} now={now} />)}
        </div>
      )
  }
}

export function ReviewsDisplay({ config, payload, notice }: ReviewsDisplayProps): ReactElement | null {
  const now = payload.readAt
  const rootRef = useRef<HTMLElement>(null)
  const reviews = selectReviews(payload.reviews, config)
  const isBadge = config.display === 'badge'

  // Nothing to show and nothing to say about it: draw nothing rather than an
  // empty box with a heading over it.
  if (!isBadge && reviews.length === 0 && !config.emptyText && !notice) return null
  if (isBadge && payload.summary.rating === null && !notice) return null

  return (
    <section
      ref={rootRef}
      className={rootClassName(config)}
      style={config.style}
      data-cactus-unstyled=""
      aria-label={config.heading ? undefined : 'Google reviews'}
    >
      <div className="grv__inner">
        {notice && <p className="grv__notice">{notice}</p>}
        {isBadge ? (
          <ReviewsBadge summary={payload.summary} />
        ) : (
          <>
            <ReviewsHeader config={config} summary={payload.summary} />
            {reviews.length > 0
              ? <ReviewsBody reviews={reviews} config={config} now={now} rootRef={rootRef} />
              : <p className="grv__empty">{config.emptyText}</p>}
          </>
        )}
        <ReviewsFooter config={config} summary={payload.summary} />
      </div>
    </section>
  )
}
