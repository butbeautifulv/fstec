import {
  dedupeBatchTargets,
  hasOrgSubdivisionConflict,
  type BatchTarget,
} from "@/lib/orders/batch-targets"
import { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"

type ValidateBatchTargetsPrisma = {
  measure: {
    findMany(args: {
      where: { id: { in: number[] } }
      select: { id: true }
    }): Promise<{ id: number }[]>
  }
  organization: {
    findMany(args: {
      where: { id: { in: number[] } }
      include: { subdivisions: { select: { id: true } } }
    }): Promise<
      { id: number; subdivisions: { id: number }[] }[]
    >
  }
}

export async function validateBatchTargets(
  db: ValidateBatchTargetsPrisma,
  targets: BatchTarget[],
  measureIds: number[]
): Promise<BatchTarget[]> {
  const uniqueTargets = dedupeBatchTargets(targets)
  if (uniqueTargets.length === 0) {
    throw new BatchCreateValidationError("INVALID_TARGETS")
  }

  if (hasOrgSubdivisionConflict(uniqueTargets)) {
    throw new BatchCreateValidationError("TARGETS_CONFLICT")
  }

  const measures = await db.measure.findMany({
    where: { id: { in: measureIds } },
    select: { id: true },
  })
  if (measures.length !== measureIds.length) {
    throw new BatchCreateValidationError("INVALID_MEASURES")
  }

  const orgIds = [...new Set(uniqueTargets.map((target) => target.organizationId))]
  const orgs = await db.organization.findMany({
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
