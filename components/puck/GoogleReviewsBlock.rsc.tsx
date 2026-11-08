import type { ReactElement } from 'react'
import { SharedStyle } from '@/components/SharedStyle'
import { reviewsCss } from '@/modules/google-reviews/components/public/reviews-css'
import { ReviewsDisplay } from '@/modules/google-reviews/components/public/ReviewsDisplay'
import { toDisplayConfig, type GoogleReviewsBlockProps } from '@/modules/google-reviews/lib/display'
import { getPublicPayload } from '@/modules/google-reviews/lib/store'
import { googleReviewsPuckComponent } from '@/modules/google-reviews/components/puck/GoogleReviewsBlock'

// Server (RSC) half of the Google Reviews block: reads the reviews straight from
// the database and hands them, with the checked display config, to the same
// display the editor draws. Only plain data crosses to the client component -
// never Puck's own prop bag, which carries functions.

export async function GoogleReviewsBlockRsc(props: GoogleReviewsBlockProps): Promise<ReactElement> {
  const payload = await getPublicPayload()
  return (
    <>
      <SharedStyle id="google-reviews" css={reviewsCss()} />
      <ReviewsDisplay config={toDisplayConfig(props)} payload={payload} />
    </>
  )
}

export const googleReviewsPuckRscComponent = {
  ...googleReviewsPuckComponent,
  render: GoogleReviewsBlockRsc,
}
