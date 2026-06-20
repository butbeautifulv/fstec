import { handleApiError } from "@/lib/api/errors"
import { revokeAccessLink } from "@/lib/access-links"

export async function revokeAccessLinkFromRequest(request: Request) {
  const linkId = Number(new URL(request.url).searchParams.get("linkId"))
  if (!linkId) throw new Error("linkId required")
  await revokeAccessLink(linkId)
  return linkId
}

export async function revokeAccessLinkFromRequestRoute(request: Request) {
  try {
    await revokeAccessLinkFromRequest(request)
    return { ok: true as const }
  } catch (error) {
    return { error: handleApiError(error) }
  }
}
