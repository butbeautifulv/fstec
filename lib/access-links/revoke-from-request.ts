import { revokeAccessLink } from "@/lib/access-links"

export async function revokeAccessLinkFromRequest(request: Request) {
  const linkId = Number(new URL(request.url).searchParams.get("linkId"))
  if (!linkId) throw new Error("linkId required")
  await revokeAccessLink(linkId)
  return linkId
}
