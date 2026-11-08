import type { ReactElement } from 'react'
// Field widget via the registry, never a direct import: the widget module pulls
// in the Puck editor, and the server half of this block spreads this object.
import { SiteColourField } from '@/lib/puck/fields/registry'
import type { FieldTabMap } from '@/lib/puck/fields/fieldTabs'
import { DEFAULT_PROPS, type GoogleReviewsBlockProps } from '@/modules/google-reviews/lib/display'
import { GoogleReviewsEditorPreview } from '@/modules/google-reviews/components/puck/GoogleReviewsEditorPreview'

// Editor half of the Google Reviews block. The live render is in
// ./GoogleReviewsBlock.rsc, which spreads this object and swaps the render.
// This file reaches the editor's browser bundle, so it never imports Prisma or
// anything server-only.

type ColourFieldRenderProps = { value: string; onChange: (value: string) => void; field: { label?: string } }

function colourField(label: string) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange, field }: ColourFieldRenderProps) => (
      <SiteColourField value={value} onChange={onChange} label={field.label} allowManual />
    ),
  }
}

const yesNo = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const alignOptions = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Right' },
]

// Which sidebar tab each field sits under. Spelled out rather than left to the
// naming rules, so a renamed field can never wander onto the wrong tab.
const FIELD_TABS: FieldTabMap = {
  heading: 'block', headingTag: 'block', intro: 'block', display: 'block', maxReviews: 'block',
  minRating: 'block', requireText: 'block', sortBy: 'block', autoScroll: 'block', interval: 'block',
  pauseOnHover: 'block', showArrows: 'block', showDots: 'block', transitionMs: 'block', tickerSeconds: 'block',
  showSummary: 'block', showAuthorPhoto: 'block', dateDisplay: 'block', showSource: 'block', linkCards: 'block',
  showGoogleLink: 'block', googleLinkLabel: 'block', showWriteReview: 'block', writeReviewLabel: 'block',
  emptyText: 'block',
  cardStyle: 'appearance', cardShadow: 'appearance', cardRadius: 'appearance', cardBorderWidth: 'appearance',
  textSize: 'appearance', headingSize: 'appearance', starSize: 'appearance', textStyle: 'appearance',
  showQuoteMark: 'appearance', photoShape: 'appearance', lineClamp: 'appearance',
  sectionBgColor: 'appearance', cardBgColor: 'appearance', cardTextColor: 'appearance', cardBorderColor: 'appearance',
  headingColor: 'appearance', introColor: 'appearance', metaColor: 'appearance', starColor: 'appearance',
  starEmptyColor: 'appearance', linkColor: 'appearance', quoteColor: 'appearance', controlBgColor: 'appearance',
  controlColor: 'appearance', dotColor: 'appearance', dotActiveColor: 'appearance',
  columns: 'layout', columnsTablet: 'layout', columnsMobile: 'layout', gap: 'layout', cardPadding: 'layout',
  maxWidth: 'layout', contentAlign: 'layout', headerAlign: 'layout', paddingTop: 'layout', paddingBottom: 'layout',
  equalHeight: 'layout', controlsPosition: 'layout',
}

const fields = {
  // ---- Block ----
  display: {
    type: 'select' as const,
    label: 'Display as',
    options: [
      { value: 'carousel', label: 'Carousel - slides along on its own' },
      { value: 'spotlight', label: 'Spotlight - one review at a time' },
      { value: 'ticker', label: 'Ticker - a steady scrolling strip' },
      { value: 'grid', label: 'Grid' },
      { value: 'masonry', label: 'Wall of quotes' },
      { value: 'list', label: 'List' },
      { value: 'badge', label: 'Rating badge only' },
    ],
  },
  heading: { type: 'text' as const, label: 'Heading' },
  headingTag: {
    type: 'select' as const,
    label: 'Heading level',
    options: [
      { value: 'h2', label: 'H2 - a main section' },
      { value: 'h3', label: 'H3 - a sub-section' },
      { value: 'h4', label: 'H4' },
      { value: 'p', label: 'Plain text, not a heading' },
    ],
  },
  intro: { type: 'textarea' as const, label: 'Introduction' },
  showSummary: { type: 'radio' as const, label: 'Show overall rating under the heading', options: yesNo },
  maxReviews: { type: 'number' as const, label: 'Most reviews to show', min: 1, max: 50 },
  minRating: {
    type: 'select' as const,
    label: 'Lowest star rating to show',
    options: [
      { value: 'site', label: 'Whatever the site setting allows' },
      { value: '2', label: '2 stars and up' },
      { value: '3', label: '3 stars and up' },
      { value: '4', label: '4 stars and up' },
      { value: '5', label: '5 stars only' },
    ],
  },
  requireText: { type: 'radio' as const, label: 'Only reviews with words', options: yesNo },
  sortBy: {
    type: 'select' as const,
    label: 'Order',
    options: [
      { value: 'newest', label: 'Newest first' },
      { value: 'highest', label: 'Highest rated first' },
      { value: 'lowest', label: 'Lowest rated first' },
      { value: 'longest', label: 'Longest first' },
    ],
  },
  autoScroll: { type: 'radio' as const, label: 'Move on by itself', options: yesNo },
  interval: { type: 'number' as const, label: 'Seconds between moves', min: 2, max: 60 },
  transitionMs: { type: 'number' as const, label: 'Slide speed in milliseconds', min: 150, max: 3000 },
  tickerSeconds: { type: 'number' as const, label: 'Seconds for one full lap', min: 10, max: 300 },
  pauseOnHover: { type: 'radio' as const, label: 'Pause while the pointer is over it', options: yesNo },
  showArrows: { type: 'radio' as const, label: 'Show arrows', options: yesNo },
  showDots: { type: 'radio' as const, label: 'Show dots', options: yesNo },
  showAuthorPhoto: { type: 'radio' as const, label: 'Show reviewer photos', options: yesNo },
  dateDisplay: {
    type: 'select' as const,
    label: 'Review date',
    options: [
      { value: 'relative', label: 'How long ago ("3 weeks ago")' },
      { value: 'date', label: 'The date ("12 March 2026")' },
      { value: 'none', label: 'Do not show' },
    ],
  },
  showSource: { type: 'radio' as const, label: 'Say "Posted on Google" on each review', options: yesNo },
  linkCards: { type: 'radio' as const, label: 'Link each review to Google', options: yesNo },
  showGoogleLink: { type: 'radio' as const, label: 'Link to your Google reviews', options: yesNo },
  googleLinkLabel: { type: 'text' as const, label: 'Google reviews link wording' },
  showWriteReview: { type: 'radio' as const, label: 'Link to leave a review', options: yesNo },
  writeReviewLabel: { type: 'text' as const, label: 'Leave a review link wording' },
  emptyText: { type: 'text' as const, label: 'Message when there are no reviews (blank = hide the block)' },

  // ---- Appearance ----
  cardStyle: {
    type: 'select' as const,
    label: 'Card style',
    options: [
      { value: 'outlined', label: 'Outlined' },
      { value: 'filled', label: 'Filled' },
      { value: 'elevated', label: 'Raised with a shadow' },
      { value: 'minimal', label: 'No card, just the words' },
    ],
  },
  cardShadow: {
    type: 'select' as const,
    label: 'Card shadow',
    options: [
      { value: 'none', label: 'None' },
      { value: 'soft', label: 'Soft' },
      { value: 'medium', label: 'Medium' },
      { value: 'strong', label: 'Strong' },
    ],
  },
  cardRadius: { type: 'number' as const, label: 'Card corner radius (px)', min: 0, max: 48 },
  cardBorderWidth: { type: 'number' as const, label: 'Card border width (px)', min: 0, max: 8 },
  textSize: {
    type: 'select' as const,
    label: 'Review text size',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
  },
  textStyle: {
    type: 'radio' as const,
    label: 'Review text style',
    options: [
      { value: 'normal', label: 'Upright' },
      { value: 'italic', label: 'Italic' },
    ],
  },
  lineClamp: { type: 'number' as const, label: 'Cut long reviews off after this many lines (0 = never)', min: 0, max: 30 },
  headingSize: {
    type: 'select' as const,
    label: 'Heading size',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra large' },
    ],
  },
  starSize: { type: 'number' as const, label: 'Star size (px)', min: 10, max: 48 },
  showQuoteMark: { type: 'radio' as const, label: 'Show a large quote mark', options: yesNo },
  photoShape: {
    type: 'select' as const,
    label: 'Reviewer photo shape',
    options: [
      { value: 'circle', label: 'Circle' },
      { value: 'rounded', label: 'Rounded square' },
      { value: 'square', label: 'Square' },
    ],
  },
  sectionBgColor: colourField('Section background'),
  cardBgColor: colourField('Card background'),
  cardTextColor: colourField('Review text colour'),
  cardBorderColor: colourField('Card border colour'),
  headingColor: colourField('Heading and score colour'),
  introColor: colourField('Introduction colour'),
  metaColor: colourField('Date and review count colour'),
  starColor: colourField('Star colour'),
  starEmptyColor: colourField('Empty star colour'),
  quoteColor: colourField('Quote mark colour'),
  linkColor: colourField('Link colour'),
  controlBgColor: colourField('Arrow and pause button background'),
  controlColor: colourField('Arrow and pause button icon colour'),
  dotColor: colourField('Dot colour'),
  dotActiveColor: colourField('Current dot colour'),

  // ---- Layout ----
  columns: { type: 'number' as const, label: 'Reviews across on a computer', min: 1, max: 6 },
  columnsTablet: { type: 'number' as const, label: 'Reviews across on a tablet', min: 1, max: 4 },
  columnsMobile: { type: 'number' as const, label: 'Reviews across on a phone', min: 1, max: 2 },
  gap: { type: 'number' as const, label: 'Space between reviews (px)', min: 0, max: 96 },
  cardPadding: { type: 'number' as const, label: 'Space inside each card (px)', min: 0, max: 96 },
  equalHeight: { type: 'radio' as const, label: 'Make cards in a row the same height', options: yesNo },
  contentAlign: { type: 'radio' as const, label: 'Review text alignment', options: alignOptions },
  headerAlign: { type: 'radio' as const, label: 'Heading alignment', options: alignOptions },
  controlsPosition: {
    type: 'radio' as const,
    label: 'Arrows',
    options: [
      { value: 'sides', label: 'Either side' },
      { value: 'below', label: 'Underneath' },
    ],
  },
  maxWidth: { type: 'number' as const, label: 'Maximum width (px, 0 = full width)', min: 0, max: 2400 },
  paddingTop: { type: 'number' as const, label: 'Space above (px)', min: 0, max: 240 },
  paddingBottom: { type: 'number' as const, label: 'Space below (px)', min: 0, max: 240 },
}

type FieldName = keyof typeof fields

// Fields that only mean something for some displays. Hidden for the others so
// the sidebar only ever offers settings that change what is on the page.
const ONLY_FOR: Partial<Record<FieldName, readonly string[]>> = {
  autoScroll: ['carousel', 'spotlight'],
  interval: ['carousel', 'spotlight'],
  transitionMs: ['carousel', 'spotlight'],
  showArrows: ['carousel', 'spotlight'],
  showDots: ['carousel', 'spotlight'],
  controlsPosition: ['carousel', 'spotlight'],
  pauseOnHover: ['carousel', 'spotlight', 'ticker'],
  tickerSeconds: ['ticker'],
  columns: ['carousel', 'grid', 'masonry'],
  columnsTablet: ['carousel', 'grid', 'masonry'],
  columnsMobile: ['carousel', 'grid', 'masonry'],
  equalHeight: ['carousel', 'spotlight', 'grid', 'list', 'ticker'],
}

// The badge is a single pill: none of the review-card settings apply to it.
const CARD_ONLY: readonly FieldName[] = [
  'heading', 'headingTag', 'intro', 'showSummary', 'maxReviews', 'minRating', 'requireText', 'sortBy',
  'showAuthorPhoto', 'dateDisplay', 'showSource', 'linkCards', 'emptyText', 'cardStyle', 'textSize', 'textStyle',
  'lineClamp', 'headingSize', 'showQuoteMark', 'photoShape', 'cardTextColor', 'headingColor', 'introColor',
  'quoteColor', 'controlBgColor', 'controlColor', 'dotColor', 'dotActiveColor', 'gap', 'cardPadding', 'equalHeight',
  'contentAlign', 'headerAlign',
]

/** The fields worth showing for this block's display, in their declared order. */
export function fieldsForDisplay<T extends Record<string, unknown>>(allFields: T, display: string): Partial<T> {
  const next: Partial<T> = { ...allFields }
  for (const [name, displays] of Object.entries(ONLY_FOR)) {
    if (displays && !displays.includes(display)) delete next[name as keyof T]
  }
  if (display === 'badge') {
    for (const name of CARD_ONLY) delete next[name as keyof T]
    // The badge's own alignment rides contentAlign, so give that one back.
    next['contentAlign' as keyof T] = allFields['contentAlign' as keyof T]
  }
  return next
}

function GoogleReviewsEditorRender(props: GoogleReviewsBlockProps): ReactElement {
  return <GoogleReviewsEditorPreview {...props} />
}

export const googleReviewsPuckComponent = {
  label: 'Google Reviews',
  fields,
  fieldTabs: FIELD_TABS,
  defaultProps: DEFAULT_PROPS,
  resolveFields(data: { props: GoogleReviewsBlockProps }, { fields: current }: { fields: typeof fields }) {
    return fieldsForDisplay(current, data.props.display ?? DEFAULT_PROPS.display)
  },
  render: GoogleReviewsEditorRender,
}
