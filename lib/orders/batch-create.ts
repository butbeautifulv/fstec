import { prisma } from "@/lib/db"
import { getDefaultStatusId } from "@/lib/statuses"
import {
  dedupeBatchTargets,
  hasOrgSubdivisionConflict,
  type BatchTarget,
} from "@/lib/orders/batch-targets"
import type { BatchCreateOrdersInput } from "@/lib/validations/measure-imports"

export class BatchCreateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BatchCreateValidationError"
  }
}

async function validateBatchTargets(targets: BatchTarget[], measureIds: number[]) {
  const uniqueTargets = dedupeBatchTargets(targets)
  if (uniqueTargets.length === 0) {
    throw new BatchCreateValidationError("INVALID_TARGETS")
  }

  if (hasOrgSubdivisionConflict(uniqueTargets)) {
    throw new BatchCreateValidationError("TARGETS_CONFLICT")
  }

  const measures = await prisma.measure.findMany({
    where: { id: { in: measureIds } },
    select: { id: true },
  })
  if (measures.length !== measureIds.length) {
    throw new BatchCreateValidationError("INVALID_MEASURES")
  }

  const orgIds = [...new Set(uniqueTargets.map((target) => target.organizationId))]
  const orgs = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    include: { subdivisions: { select: { id: true } } },
  })
  if (orgs.length !== orgIds.length) {
    throw new BatchCreateValidationError("INVALID_TARGETS")
  }

  const subdivisionsByOrg = new Map(
    orgs.map((org) => [org.id, new Set(org.subdivisions.map((sub) => sub.id))])
  )

  for (const target of uniqueTargets) {
    if (target.subdivisionId == null) continue
    const allowed = subdivisionsByOrg.get(target.organizationId)
    if (!allowed?.has(target.subdivisionId)) {
      throw new BatchCreateValidationError("INVALID_TARGETS")
    }
  }

  return uniqueTargets
}

export async function batchCreateOrders(
  input: BatchCreateOrdersInput,
  createdById: number
) {
  const defaultStatusId = await getDefaultStatusId()
  const dueAt = input.defaultDueAt
  const targets = await validateBatchTargets(
    input.targets.map((target) => ({
      organizationId: target.organizationId,
      subdivisionId: target.subdivisionId ?? null,
    })),
    input.measureIds
  )

  if (input.sourceImportId != null) {
    const importRecord = await prisma.measureImport.findUnique({
      where: { id: input.sourceImportId },
      select: { status: true },
    })
    if (!importRecord || importRecord.status !== "IMPORTED") {
      throw new BatchCreateValidationError("IMPORT_INVALID_STATUS")
    }
  }

  return prisma.$transaction(async (tx) => {
    const orders = []

    for (const target of targets) {
      const order = await tx.order.create({
        data: {
          title: input.title,
          organizationId: target.organizationId,
          createdById,
          sourceImportId: input.sourceImportId ?? null,
          defaultDueAt: dueAt,
          items: {
            create: input.measureIds.map((measureId) => ({
              measureId,
              dueAt,
              statusId: defaultStatusId,
              subdivisionId: target.subdivisionId ?? null,
            })),
          },
        },
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      })
      orders.push(order)
    }

    return orders
  })
}
