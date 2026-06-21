import type { Prisma } from "@prisma/client"

type ImportItem = {
  id: number
  code: string | null
  name: string
  description: string | null
  measureId: number | null
}

export async function upsertMeasureFromImportItem(
  item: ImportItem,
  importId: number,
  createdById: number,
  tx: Prisma.TransactionClient
) {
  if (item.measureId != null) {
    return tx.measure.findUniqueOrThrow({ where: { id: item.measureId } })
  }

  const existing =
    item.code != null ? await tx.measure.findFirst({ where: { code: item.code } }) : null

  const measure = existing
    ? await tx.measure.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          sourceImportId: importId,
        },
      })
    : await tx.measure.create({
        data: {
          name: item.name,
          description: item.description,
          code: item.code,
          createdById,
          sourceImportId: importId,
          sourceImportItemId: item.id,
        },
      })

  await tx.measureImportItem.update({
    where: { id: item.id },
    data: { measureId: measure.id },
  })

  return measure
}
