import {
  dedupeBatchTargets,
  hasOrgSubdivisionConflict,
  type BatchTarget,
} from "@/lib/orders/batch-targets"
import { BatchCreateValidationError } from "@/lib/orders/batch-create-errors"

export type ValidateBatchTarget = BatchTarget & { measureIds: number[] }

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

function dedupeTargetsWithMeasures(targets: ValidateBatchTarget[]): ValidateBatchTarget[] {
  const byKey = new Map<string, ValidateBatchTarget>()
  for (const target of targets) {
    const key = `${target.organizationId}:${target.subdivisionId ?? "null"}`
    const existing = byKey.get(key)
    if (existing) {
      existing.measureIds = [...new Set([...existing.measureIds, ...target.measureIds])]
    } else {
      byKey.set(key, { ...target, measureIds: [...target.measureIds] })
    }
  }
  return [...byKey.values()]
}

export async function validateBatchTargets(
  db: ValidateBatchTargetsPrisma,
  targets: ValidateBatchTarget[],
  globalMeasureIds: number[]
): Promise<ValidateBatchTarget[]> {
  const withMeasures = targets.map((target) => ({
    ...target,
    measureIds:
      target.measureIds.length > 0 ? target.measureIds : globalMeasureIds,
  }))

  const uniqueTargets = dedupeTargetsWithMeasures(withMeasures)

  if (uniqueTargets.length === 0) {
    throw new BatchCreateValidationError("INVALID_TARGETS")
  }

  if (hasOrgSubdivisionConflict(uniqueTargets)) {
    throw new BatchCreateValidationError("TARGETS_CONFLICT")
  }

  const allMeasureIds = [...new Set(uniqueTargets.flatMap((t) => t.measureIds))]

  if (allMeasureIds.length === 0) {
    throw new BatchCreateValidationError("INVALID_MEASURES")
  }

  const measures = await db.measure.findMany({
    where: { id: { in: allMeasureIds } },
    select: { id: true },
  })
  if (measures.length !== allMeasureIds.length) {
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
