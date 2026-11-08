// Turns a Google Reviews block's saved props into what the display draws.
//
// Pure and client-safe. Both halves of the block - the editor preview and the
// server render - pass their props through here, which is what keeps the two
// from ever drawing different markup for the same settings.

import type { CSSProperties } from 'react'
import type { PublicReview } from '@/modules/google-reviews/lib/types'

export const DISPLAY_MODES = ['carousel', 'grid', 'list', 'masonry', 'spotlight', 'ticker', 'badge'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

export const SORT_ORDERS = ['newest', 'highest', 'lowest', 'longest'] as const
export type SortOrder = (typeof SORT_ORDERS)[number]

export const DATE_DISPLAYS = ['relative', 'date', 'none'] as const
export type DateDisplay = (typeof DATE_DISPLAYS)[number]

export const CARD_STYLES = ['outlined', 'filled', 'elevated', 'minimal'] as const
export type CardStyle = (typeof CARD_STYLES)[number]

export const SHADOWS = ['none', 'soft', 'medium', 'strong'] as const
export type Shadow = (typeof SHADOWS)[number]

export const TEXT_SIZES = ['sm', 'md', 'lg'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

export const HEADING_SIZES = ['sm', 'md', 'lg', 'xl'] as const
export type HeadingSize = (typeof HEADING_SIZES)[number]

export const PHOTO_SHAPES = ['circle', 'rounded', 'square'] as const
export type PhotoShape = (typeof PHOTO_SHAPES)[number]

export const ALIGNMENTS = ['left', 'center', 'right'] as const
export type Alignment = (typeof ALIGNMENTS)[number]

export const HEADING_TAGS = ['h2', 'h3', 'h4', 'p'] as const
export type HeadingTag = (typeof HEADING_TAGS)[number]

export const CONTROLS_POSITIONS = ['sides', 'below'] as const
export type ControlsPosition = (typeof CONTROLS_POSITIONS)[number]

/** Every prop the block saves. Puck hands them over loosely typed, so all are optional. */
export interface GoogleReviewsBlockProps {
  id?: string
  // Block - what it says and does
  heading?: string
  headingTag?: string
  intro?: string
  display?: string
  maxReviews?: number
  minRating?: string
  requireText?: string
  sortBy?: string
  autoScroll?: string
  interval?: number
  pauseOnHover?: string
  showArrows?: string
  showDots?: string
  transitionMs?: number
  tickerSeconds?: number
  showSummary?: string
  showAuthorPhoto?: string
  dateDisplay?: string
  showSource?: string
  linkCards?: string
  showGoogleLink?: string
  googleLinkLabel?: string
  showWriteReview?: string
  writeReviewLabel?: string
  emptyText?: string
  // Appearance - how it looks
  cardStyle?: string
  sectionBgColor?: string
  cardBgColor?: string
  cardTextColor?: string
  cardBorderColor?: string
  headingColor?: string
  introColor?: string
  metaColor?: string
  starColor?: string
  starEmptyColor?: string
  linkColor?: string
  quoteColor?: string
  controlBgColor?: string
  controlColor?: string
  dotColor?: string
  dotActiveColor?: string
  cardRadius?: number
  cardBorderWidth?: number
  cardShadow?: string
  textSize?: string
  headingSize?: string
  starSize?: number
  textStyle?: string
  showQuoteMark?: string
  photoShape?: string
  lineClamp?: number
  // Layout - where it sits and how much room it takes
  columns?: number
  columnsTablet?: number
  columnsMobile?: number
  gap?: number
  cardPadding?: number
  maxWidth?: number
  contentAlign?: string
  headerAlign?: string
  paddingTop?: number
  paddingBottom?: number
  equalHeight?: string
  controlsPosition?: string
}

/** The props, checked, clamped and defaulted. Everything the display reads comes from here. */
export interface DisplayConfig {
  blockId: string
  heading: string
  headingTag: HeadingTag
  intro: string
  display: DisplayMode
  maxReviews: number
  /** null = whatever the site-wide setting allows. */
  minRating: number | null
  requireText: boolean
  sortBy: SortOrder
  autoScroll: boolean
  intervalMs: number
  pauseOnHover: boolean
  showArrows: boolean
  showDots: boolean
  transitionMs: number
  tickerSeconds: number
  showSummary: boolean
  showAuthorPhoto: boolean
  dateDisplay: DateDisplay
  showSource: boolean
  linkCards: boolean
  showGoogleLink: boolean
  googleLinkLabel: string
  showWriteReview: boolean
  writeReviewLabel: string
  emptyText: string
  cardStyle: CardStyle
  cardShadow: Shadow
  textSize: TextSize
  headingSize: HeadingSize
  italic: boolean
  showQuoteMark: boolean
  photoShape: PhotoShape
  lineClamp: number
  equalHeight: boolean
  contentAlign: Alignment
  headerAlign: Alignment
  controlsPosition: ControlsPosition
  /** Custom properties for the block's root element. Only what was set is present. */
  style: CSSProperties
}

export const DEFAULT_PROPS: Required<Omit<GoogleReviewsBlockProps, 'id'>> = {
  heading: 'What our customers say',
  headingTag: 'h2',
  intro: '',
  display: 'carousel',
  maxReviews: 12,
  minRating: 'site',
  requireText: 'yes',
  sortBy: 'newest',
  autoScroll: 'yes',
  interval: 5,
  pauseOnHover: 'yes',
  showArrows: 'yes',
  showDots: 'yes',
  transitionMs: 600,
  tickerSeconds: 40,
  showSummary: 'yes',
  showAuthorPhoto: 'yes',
  dateDisplay: 'relative',
  showSource: 'yes',
  linkCards: 'no',
  showGoogleLink: 'yes',
  googleLinkLabel: 'See all our reviews on Google',
  showWriteReview: 'no',
  writeReviewLabel: 'Leave us a review',
  emptyText: '',
  cardStyle: 'outlined',
  sectionBgColor: '',
  cardBgColor: '',
  cardTextColor: '',
  cardBorderColor: '',
  headingColor: '',
  introColor: '',
  metaColor: '',
  starColor: '',
  starEmptyColor: '',
  linkColor: '',
  quoteColor: '',
  controlBgColor: '',
  controlColor: '',
  dotColor: '',
  dotActiveColor: '',
  cardRadius: 12,
  cardBorderWidth: 1,
  cardShadow: 'none',
  textSize: 'md',
  headingSize: 'lg',
  starSize: 18,
  textStyle: 'normal',
  showQuoteMark: 'no',
  photoShape: 'circle',
  lineClamp: 6,
  columns: 3,
  columnsTablet: 2,
  columnsMobile: 1,
  gap: 24,
  cardPadding: 24,
  maxWidth: 0,
  contentAlign: 'left',
  headerAlign: 'center',
  paddingTop: 0,
  paddingBottom: 0,
  equalHeight: 'yes',
  controlsPosition: 'sides',
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function isYes(value: string | undefined, fallback: string): boolean {
  return (value ?? fallback) === 'yes'
}

function textOr(value: string | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

// A colour goes into an inline style, where a stray ";" or "}" would let it
// write declarations of its own. Anything carrying those, markup, or a url()
// is dropped - the block falls back to the theme colour instead.
const UNSAFE_COLOUR = /[;{}<>\\]|url\s*\(|expression\s*\(|@import/i

/** A colour value safe to put in a custom property, or null. */
export function safeColour(value: string | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 200 || UNSAFE_COLOUR.test(trimmed)) return null
  return trimmed
}

// Prop name -> the custom property the stylesheet reads it through.
const COLOUR_VARS: ReadonlyArray<readonly [keyof GoogleReviewsBlockProps, string]> = [
  ['sectionBgColor', '--grv-section-bg'],
  ['cardBgColor', '--grv-card-bg'],
  ['cardTextColor', '--grv-card-text'],
  ['cardBorderColor', '--grv-card-border'],
  ['headingColor', '--grv-heading'],
  ['introColor', '--grv-intro'],
  ['metaColor', '--grv-meta'],
  ['starColor', '--grv-star'],
  ['starEmptyColor', '--grv-star-empty'],
  ['linkColor', '--grv-link'],
  ['quoteColor', '--grv-quote'],
  ['controlBgColor', '--grv-control-bg'],
  ['controlColor', '--grv-control'],
  ['dotColor', '--grv-dot'],
  ['dotActiveColor', '--grv-dot-active'],
]

function buildStyle(props: GoogleReviewsBlockProps): CSSProperties {
  const style: Record<string, string> = {}
  for (const [propName, varName] of COLOUR_VARS) {
    const colour = safeColour(props[propName] as string | undefined)
    if (colour) style[varName] = colour
  }
  const px = (value: number) => `${value}px`
  style['--grv-cols'] = String(clampNumber(props.columns, 1, 6, DEFAULT_PROPS.columns))
  style['--grv-cols-tablet'] = String(clampNumber(props.columnsTablet, 1, 4, DEFAULT_PROPS.columnsTablet))
  style['--grv-cols-mobile'] = String(clampNumber(props.columnsMobile, 1, 2, DEFAULT_PROPS.columnsMobile))
  style['--grv-gap'] = px(clampNumber(props.gap, 0, 96, DEFAULT_PROPS.gap))
  style['--grv-card-pad'] = px(clampNumber(props.cardPadding, 0, 96, DEFAULT_PROPS.cardPadding))
  style['--grv-radius'] = px(clampNumber(props.cardRadius, 0, 48, DEFAULT_PROPS.cardRadius))
  style['--grv-border-width'] = px(clampNumber(props.cardBorderWidth, 0, 8, DEFAULT_PROPS.cardBorderWidth))
  style['--grv-star-size'] = px(clampNumber(props.starSize, 10, 48, DEFAULT_PROPS.starSize))
  style['--grv-pad-top'] = px(clampNumber(props.paddingTop, 0, 240, DEFAULT_PROPS.paddingTop))
  style['--grv-pad-bottom'] = px(clampNumber(props.paddingBottom, 0, 240, DEFAULT_PROPS.paddingBottom))
  style['--grv-transition'] = `${clampNumber(props.transitionMs, 150, 3000, DEFAULT_PROPS.transitionMs)}ms`
  style['--grv-ticker-duration'] = `${clampNumber(props.tickerSeconds, 10, 300, DEFAULT_PROPS.tickerSeconds)}s`
  const maxWidth = clampNumber(props.maxWidth, 0, 2400, DEFAULT_PROPS.maxWidth)
  if (maxWidth > 0) style['--grv-max-width'] = px(maxWidth)
  const clamp = clampNumber(props.lineClamp, 0, 30, DEFAULT_PROPS.lineClamp)
  if (clamp > 0) style['--grv-clamp'] = String(clamp)
  return style as CSSProperties
}

export function toDisplayConfig(props: GoogleReviewsBlockProps): DisplayConfig {
  const defaults = DEFAULT_PROPS
  const minRatingRaw = props.minRating ?? defaults.minRating
  const minRating = minRatingRaw === 'site' ? null : clampNumber(Number.parseInt(minRatingRaw, 10), 1, 5, 1)
  return {
    blockId: props.id ?? '',
    heading: textOr(props.heading, defaults.heading).trim(),
    headingTag: pick(props.headingTag, HEADING_TAGS, 'h2'),
    intro: textOr(props.intro, defaults.intro).trim(),
    display: pick(props.display, DISPLAY_MODES, 'carousel'),
    maxReviews: clampNumber(props.maxReviews, 1, 50, defaults.maxReviews),
    minRating,
    requireText: isYes(props.requireText, defaults.requireText),
    sortBy: pick(props.sortBy, SORT_ORDERS, 'newest'),
    autoScroll: isYes(props.autoScroll, defaults.autoScroll),
    intervalMs: clampNumber(props.interval, 2, 60, defaults.interval) * 1000,
    pauseOnHover: isYes(props.pauseOnHover, defaults.pauseOnHover),
    showArrows: isYes(props.showArrows, defaults.showArrows),
    showDots: isYes(props.showDots, defaults.showDots),
    transitionMs: clampNumber(props.transitionMs, 150, 3000, defaults.transitionMs),
    tickerSeconds: clampNumber(props.tickerSeconds, 10, 300, defaults.tickerSeconds),
    showSummary: isYes(props.showSummary, defaults.showSummary),
    showAuthorPhoto: isYes(props.showAuthorPhoto, defaults.showAuthorPhoto),
    dateDisplay: pick(props.dateDisplay, DATE_DISPLAYS, 'relative'),
    showSource: isYes(props.showSource, defaults.showSource),
    linkCards: isYes(props.linkCards, defaults.linkCards),
    showGoogleLink: isYes(props.showGoogleLink, defaults.showGoogleLink),
    googleLinkLabel: textOr(props.googleLinkLabel, defaults.googleLinkLabel).trim() || defaults.googleLinkLabel,
    showWriteReview: isYes(props.showWriteReview, defaults.showWriteReview),
    writeReviewLabel: textOr(props.writeReviewLabel, defaults.writeReviewLabel).trim() || defaults.writeReviewLabel,
    emptyText: textOr(props.emptyText, defaults.emptyText).trim(),
    cardStyle: pick(props.cardStyle, CARD_STYLES, 'outlined'),
    cardShadow: pick(props.cardShadow, SHADOWS, 'none'),
    textSize: pick(props.textSize, TEXT_SIZES, 'md'),
    headingSize: pick(props.headingSize, HEADING_SIZES, 'lg'),
    italic: props.textStyle === 'italic',
    showQuoteMark: isYes(props.showQuoteMark, defaults.showQuoteMark),
    photoShape: pick(props.photoShape, PHOTO_SHAPES, 'circle'),
    lineClamp: clampNumber(props.lineClamp, 0, 30, defaults.lineClamp),
    equalHeight: isYes(props.equalHeight, defaults.equalHeight),
    contentAlign: pick(props.contentAlign, ALIGNMENTS, 'left'),
    headerAlign: pick(props.headerAlign, ALIGNMENTS, 'center'),
    controlsPosition: pick(props.controlsPosition, CONTROLS_POSITIONS, 'sides'),
    style: buildStyle(props),
  }
}

function publishedTime(review: PublicReview): number {
  if (!review.publishedAt) return 0
  const time = Date.parse(review.publishedAt)
  return Number.isNaN(time) ? 0 : time
}

const COMPARATORS: Record<SortOrder, (a: PublicReview, b: PublicReview) => number> = {
  newest: (a, b) => publishedTime(b) - publishedTime(a),
  highest: (a, b) => b.rating - a.rating || publishedTime(b) - publishedTime(a),
  lowest: (a, b) => a.rating - b.rating || publishedTime(b) - publishedTime(a),
  longest: (a, b) => b.text.length - a.text.length || publishedTime(b) - publishedTime(a),
}

/**
 * The reviews this block shows, in order. The list it is given has already
 * passed the site-wide rules; a block can only be stricter than those.
 */
export function selectReviews(reviews: readonly PublicReview[], config: DisplayConfig): PublicReview[] {
  return reviews
    .filter((review) => config.minRating === null || review.rating >= config.minRating)
    .filter((review) => !config.requireText || review.text.trim().length > 0)
    .slice()
    .sort(COMPARATORS[config.sortBy])
    .slice(0, config.maxReviews)
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * "3 weeks ago", worked out from the publish time against `now`. Computed rather
 * than taken from Google's stored phrase, which is only true on the day it was
 * fetched. `now` is passed in so the server and the editor can agree on it.
 */
export function relativeTimeLabel(publishedAt: string | null, fallback: string | null, now: number): string {
  if (!publishedAt) return fallback ?? ''
  const then = Date.parse(publishedAt)
  if (Number.isNaN(then)) return fallback ?? ''
  const elapsed = Math.max(0, now - then)
  const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'} ago`
  if (elapsed < HOUR) return 'Just now'
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'day')
  if (elapsed < 30 * DAY) return plural(Math.floor(elapsed / (7 * DAY)), 'week')
  if (elapsed < 365 * DAY) return plural(Math.floor(elapsed / (30 * DAY)), 'month')
  return plural(Math.floor(elapsed / (365 * DAY)), 'year')
}

/** "12 March 2026", in British order, fixed to UTC so server and browser agree. */
export function absoluteDateLabel(publishedAt: string | null): string {
  if (!publishedAt) return ''
  const time = Date.parse(publishedAt)
  if (Number.isNaN(time)) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(time)
}
