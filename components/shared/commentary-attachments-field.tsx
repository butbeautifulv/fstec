"use client"

import {
  CommentaryAttachmentsField as GuiCommentaryAttachmentsField,
  type CommentaryAttachmentsValue,
  useCommentaryAttachmentsState,
} from "@cxado/gui/forms/commentary-attachments-field"
import { MAX_ATTACHMENTS_PER_RESPONSE } from "@/lib/storage/config"

export type { CommentaryAttachmentsValue }
export { useCommentaryAttachmentsState }

export function CommentaryAttachmentsField(
  props: Omit<
    React.ComponentProps<typeof GuiCommentaryAttachmentsField>,
    "maxAttachments"
  >
) {
  return (
    <GuiCommentaryAttachmentsField
      maxAttachments={MAX_ATTACHMENTS_PER_RESPONSE}
      {...props}
    />
  )
}
