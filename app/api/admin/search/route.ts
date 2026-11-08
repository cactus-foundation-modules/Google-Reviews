// POST /api/m/google-reviews/admin/search - "find your business" on the settings tab.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { refuseUnlessManager } from '@/modules/google-reviews/lib/admin-guard'
import { GooglePlacesError, searchPlaces } from '@/modules/google-reviews/lib/google-places'
import { getApiKey } from '@/modules/google-reviews/lib/store'

const Body = z.object({
  query: z.string().trim().min(2, 'Type at least two letters of your business name.').max(200),
})

export async function POST(request: NextRequest) {
  const refusal = await refuseUnlessManager()
  if (refusal) return refusal

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid search', 400)

  const apiKey = await getApiKey()
  if (!apiKey) return errorResponse('Save a Google API key first - the search goes through it.', 400)

  try {
    return NextResponse.json({ results: await searchPlaces(apiKey, parsed.data.query) })
  } catch (error) {
    if (error instanceof GooglePlacesError) return errorResponse(error.message, 502)
    console.error('[google-reviews] place search failed', error)
    return errorResponse('The search could not be run.', 500)
  }
}
