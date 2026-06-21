import type { MeasureImportStatus } from "@prisma/client"

export function assertImportEditableStatus(status: MeasureImportStatus | string) {
  if (status !== "PARSED" && status !== "IMPORTED") {
    throw new Error("IMPORT_INVALID_STATUS")
  }
}
