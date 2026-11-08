// The one permission check every admin route in this module makes.

import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'

export const MANAGE_PERMISSION = 'googlereviews.manage'

/** A response to send back when the caller may not manage this module, or null when they may. */
export async function refuseUnlessManager(): Promise<Response | null> {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!await hasPermission(user, MANAGE_PERMISSION)) return errorResponse('Forbidden', 403)
  return null
}
