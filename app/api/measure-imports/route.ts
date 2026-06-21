import { Permission } from "@/lib/auth/permissions"
import { requirePermission } from "@/lib/auth/session"
import { handleApiError, jsonOk } from "@/lib/api/errors"
import {
  createMeasureImportUpload,
  listMeasureImports,
} from "@/lib/measure-imports"
import {
  isAllowedRegulatoryDocMimeType,
  isDocxFilename,
  MAX_REGULATORY_DOC_SIZE_BYTES,
} from "@/lib/regulatory-docs/config"

export async function GET() {
  try {
    await requirePermission(Permission.measuresRead)
    return jsonOk(await listMeasureImports())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(Permission.measuresWrite)
    const formData = await request.formData()
    const file = formData.get("file")
    const parentImportIdRaw = formData.get("parentImportId")

    if (!(file instanceof File)) {
      return handleApiError(new Error("INVALID_FILE"))
    }

    if (!isDocxFilename(file.name)) {
      return handleApiError(new Error("INVALID_DOCX"))
    }

    const mimeType = file.type || "application/octet-stream"
    if (!isAllowedRegulatoryDocMimeType(mimeType) && !isDocxFilename(file.name)) {
      return handleApiError(new Error("INVALID_DOCX"))
    }

    if (file.size <= 0 || file.size > MAX_REGULATORY_DOC_SIZE_BYTES) {
      return handleApiError(new Error("INVALID_FILE_SIZE"))
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parentImportId =
      parentImportIdRaw != null && parentImportIdRaw !== ""
        ? Number(parentImportIdRaw)
        : null

    if (parentImportId != null && Number.isNaN(parentImportId)) {
      return handleApiError(new Error("INVALID_PARENT_IMPORT"))
    }

    const record = await createMeasureImportUpload({
      buffer,
      originalName: file.name,
      mimeType:
        mimeType === "application/octet-stream"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : mimeType,
      uploadedById: session.userId,
      parentImportId,
    })

    return jsonOk(record, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
