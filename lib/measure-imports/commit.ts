import { prisma } from "@/lib/db"
import { revalidatePanelMeasures } from "@/lib/api/revalidate-panel"
import { assertImportEditableStatus } from "@/lib/measure-imports/status"
import { upsertMeasureFromImportItem } from "@/lib/measures/upsert-from-import"

export async function commitMeasureImport(importId: number, createdById: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { items: { where: { included: true }, orderBy: { sortOrder: "asc" } } },
  })

  if (!record) throw new Error("NOT_FOUND")
  assertImportEditableStatus(record.status)
  if (record.items.length === 0) throw new Error("NO_ITEMS")

  await prisma.$transaction(async (tx) => {
    for (const item of record.items) {
      await upsertMeasureFromImportItem(item, importId, createdById, tx)
    }

    await tx.measureImport.update({
      where: { id: importId },
      data: { status: "IMPORTED", importedAt: new Date() },
    })
  })

  revalidatePanelMeasures()
  return prisma.measureImport.findUnique({
    where: { id: importId },
    include: {
      items: { orderBy: { sortOrder: "asc" }, include: { measure: true } },
      measures: true,
    },
  })
}

export async function getCommittedMeasureIds(importId: number): Promise<number[]> {
  const items = await prisma.measureImportItem.findMany({
    where: { importId, included: true, measureId: { not: null } },
    select: { measureId: true },
  })
  return items.map((item) => item.measureId!).filter(Boolean)
}
