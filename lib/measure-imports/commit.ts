import { prisma } from "@/lib/db"
import { revalidatePanelMeasures } from "@/lib/api/revalidate-panel"

export async function commitMeasureImport(importId: number, createdById: number) {
  const record = await prisma.measureImport.findUnique({
    where: { id: importId },
    include: { items: { where: { included: true }, orderBy: { sortOrder: "asc" } } },
  })

  if (!record) throw new Error("NOT_FOUND")
  if (record.status !== "PARSED" && record.status !== "IMPORTED") {
    throw new Error("IMPORT_INVALID_STATUS")
  }
  if (record.items.length === 0) throw new Error("NO_ITEMS")

  await prisma.$transaction(async (tx) => {
    for (const item of record.items) {
      let measureId = item.measureId

      if (measureId == null) {
        const existing =
          item.code != null
            ? await tx.measure.findFirst({ where: { code: item.code } })
            : null

        if (existing) {
          const updated = await tx.measure.update({
            where: { id: existing.id },
            data: {
              name: item.name,
              description: item.description,
              sourceImportId: importId,
            },
          })
          measureId = updated.id
        } else {
          const created = await tx.measure.create({
            data: {
              name: item.name,
              description: item.description,
              code: item.code,
              createdById,
              sourceImportId: importId,
              sourceImportItemId: item.id,
            },
          })
          measureId = created.id
        }

        await tx.measureImportItem.update({
          where: { id: item.id },
          data: { measureId },
        })
      }
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
