// POST /api/m/google-reviews/admin/refresh - the "Fetch reviews now" button.
import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/utils'
import { refuseUnlessManager } from '@/modules/google-reviews/lib/admin-guard'
import { refreshReviews } from '@/modules/google-reviews/lib/refresh'
import { getAdminSettings, listAdminReviews } from '@/modules/google-reviews/lib/store'

export async function POST() {
  const refusal = await refuseUnlessManager()
  if (refusal) return refusal

  const result = await refreshReviews()
  if (!result.ok) return errorResponse(result.error, result.skipped ? 400 : 502)

  const [settings, reviews] = await Promise.all([getAdminSettings(), listAdminReviews()])
  return NextResponse.json({ reviewCount: result.reviewCount, settings, reviews })
}
