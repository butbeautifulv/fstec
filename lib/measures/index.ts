import { prisma } from "@/lib/db"
import type { MeasureInput } from "@/lib/validations/measures"

export function listMeasures() {
  return prisma.measure.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
}

export function getMeasure(id: number) {
  return prisma.measure.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  })
}

export function createMeasure(data: MeasureInput, createdById: number) {
  return prisma.measure.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      code: data.code ?? null,
      createdById,
    },
  })
}

export function updateMeasure(id: number, data: MeasureInput) {
  return prisma.measure.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      code: data.code ?? null,
    },
  })
}

export async function deleteMeasure(id: number) {
  const inUse = await prisma.orderItem.count({ where: { measureId: id } })
  if (inUse > 0) throw new Error("MEASURE_IN_USE")
  return prisma.measure.delete({ where: { id } })
}
