// GET/PATCH /api/m/google-reviews/admin/settings
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { refuseUnlessManager } from '@/modules/google-reviews/lib/admin-guard'
import { getAdminSettings, listAdminReviews, updateSettings } from '@/modules/google-reviews/lib/store'

async function view() {
  const [settings, reviews] = await Promise.all([getAdminSettings(), listAdminReviews()])
  return { settings, reviews }
}

export async function GET() {
  const refusal = await refuseUnlessManager()
  if (refusal) return refusal
  return NextResponse.json(await view())
}

const Body = z.object({
  // Length caps only stop half a page landing in a column. A Google key is 39
  // characters today; the cap leaves room for whatever Google does next.
  apiKey: z.string().max(200).optional(),
  clearApiKey: z.boolean().optional(),
  placeId: z.string().max(300).optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  requireText: z.boolean().optional(),
  keepHistory: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const refusal = await refuseUnlessManager()
  if (refusal) return refusal

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid settings', 400)

  try {
    await updateSettings(parsed.data)
  } catch (error) {
    console.error('[google-reviews] could not save settings', error)
    return errorResponse('Those settings could not be saved.', 500)
  }
  return NextResponse.json(await view())
}
