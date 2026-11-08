// PATCH /api/m/google-reviews/admin/reviews - hide or show one review.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { refuseUnlessManager } from '@/modules/google-reviews/lib/admin-guard'
import { listAdminReviews, setReviewHidden } from '@/modules/google-reviews/lib/store'

const Body = z.object({
  id: z.string().min(1).max(500),
  hidden: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  const refusal = await refuseUnlessManager()
  if (refusal) return refusal

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid request', 400)

  try {
    const found = await setReviewHidden(parsed.data.id, parsed.data.hidden)
    if (!found) return errorResponse('That review is no longer stored - Google may have stopped showing it.', 404)
    return NextResponse.json({ reviews: await listAdminReviews() })
  } catch (error) {
    console.error('[google-reviews] could not change a review', error)
    return errorResponse('That review could not be changed.', 500)
  }
}
