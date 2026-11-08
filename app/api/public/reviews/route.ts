// GET /api/m/google-reviews/public/reviews
//
// The reviews a visitor may see, for the block's editor preview. The live block
// reads the same thing straight from the database on the server, so nothing on
// a published page calls this.
import { NextResponse } from 'next/server'
import { getPublicPayload } from '@/modules/google-reviews/lib/store'

export async function GET() {
  return NextResponse.json(await getPublicPayload())
}

// The same answer for everybody, and it changes once a day at most.
export const publicCacheTtl = 300
