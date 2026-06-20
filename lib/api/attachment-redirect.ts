import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api/errors"
import { getAttachmentReadUrl } from "@/lib/attachments"

type AttachmentLookup = (attachmentId: number) => Promise<unknown | null>

export function createAttachmentRedirectHandler(resolve: AttachmentLookup) {
  return async function handleAttachmentRedirect(
    request: Request,
    attachmentId: number
  ) {
    const download = new URL(request.url).searchParams.get("download") === "1"

    const attachment = await resolve(attachmentId)
    if (!attachment) return handleApiError(new Error("NOT_FOUND"))

    const url = await getAttachmentReadUrl(attachmentId, { download })
    if (!url) return handleApiError(new Error("NOT_FOUND"))

    return NextResponse.redirect(url)
  }
}
