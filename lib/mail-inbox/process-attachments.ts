import { createMeasureImportUpload, parseMeasureImport } from "@/lib/measure-imports"
import { extractDocumentNumber } from "@/lib/measure-imports/extract-metadata"
import { extractDocxParagraphsAsync } from "@/lib/measure-imports/parse-docx"
import { isDocxFilename } from "@/lib/regulatory-docs/config"

export type InboxAttachmentPart = {
  part: string
  filename: string
  type: string
}

export async function processInboxAttachments(
  parts: InboxAttachmentPart[],
  download: (part: string) => Promise<Buffer>,
  uploadedById: number
) {
  const letterParents = new Map<string, number>()
  const sorted = [...parts].sort((a, b) => {
    const aApp = /приложение/i.test(a.filename) ? 1 : 0
    const bApp = /приложение/i.test(b.filename) ? 1 : 0
    return aApp - bApp
  })

  let processed = 0

  for (const part of sorted) {
    if (!isDocxFilename(part.filename)) continue
    const buffer = await download(part.part)
    const isAppendix = /приложение/i.test(part.filename)

    let parentImportId: number | null = null
    let docNumber: string | null = null

    try {
      const paragraphs = await extractDocxParagraphsAsync(buffer)
      docNumber = extractDocumentNumber(paragraphs, part.filename)
      if (isAppendix && docNumber && letterParents.has(docNumber)) {
        parentImportId = letterParents.get(docNumber)!
      }
    } catch {
      // invalid docx in tests or corrupt attachment
    }

    const record = await createMeasureImportUpload({
      buffer,
      originalName: part.filename,
      mimeType: part.type,
      uploadedById,
      parentImportId,
      uploadedVia: "EMAIL",
    })

    if (!isAppendix && docNumber) {
      letterParents.set(docNumber, record.id)
    }

    await parseMeasureImport(record.id)
    processed += 1
  }

  return processed
}
