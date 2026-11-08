// GET /api/m/google-reviews/cron/refresh - the scheduled pull from Google.
import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/utils'
import { refreshReviews } from '@/modules/google-reviews/lib/refresh'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return errorResponse('CRON_SECRET is not configured', 503)
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return errorResponse('Unauthorized', 401)

  const result = await refreshReviews()
  // A site that has not been set up yet has nothing to pull, which is a quiet
  // success rather than a failure the schedules page should shout about.
  if (!result.ok && result.skipped) return NextResponse.json({ ok: true, skipped: result.error })
  if (!result.ok) return errorResponse(result.error, 502)
  return NextResponse.json({ ok: true, reviewCount: result.reviewCount })
}
