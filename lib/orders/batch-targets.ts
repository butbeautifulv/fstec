export type BatchTarget = {
  organizationId: number
  subdivisionId: number | null
}

export type SupervisedOrg = {
  id: number
  name: string
  subdivisions: { id: number; name: string }[]
}

export function expandHeadSubdivisionTargets(
  orgs: SupervisedOrg[],
  headOrganizationId: number | null
): BatchTarget[] {
  if (headOrganizationId == null) return []
  const head = orgs.find((org) => org.id === headOrganizationId)
  if (!head || head.subdivisions.length === 0) return []
  return head.subdivisions.map((sub) => ({
    organizationId: head.id,
    subdivisionId: sub.id,
  }))
}

export function expandDzoTargets(
  orgs: SupervisedOrg[],
  headOrganizationId: number | null
): BatchTarget[] {
  return orgs
    .filter((org) => org.id !== headOrganizationId)
    .flatMap((org) =>
      org.subdivisions.length > 0
        ? org.subdivisions.map((sub) => ({
            organizationId: org.id,
            subdivisionId: sub.id,
          }))
        : [{ organizationId: org.id, subdivisionId: null }]
    )
}

export function expandImportDefaultTargets(
  orgs: SupervisedOrg[],
  headOrganizationId: number | null
): BatchTarget[] {
  return [
    ...expandHeadSubdivisionTargets(orgs, headOrganizationId),
    ...expandDzoTargets(orgs, headOrganizationId),
  ]
}

export function expandBatchTargets(
  orgs: SupervisedOrg[],
  strategy: "perSubdivisionIfAny" = "perSubdivisionIfAny"
): BatchTarget[] {
  const targets: BatchTarget[] = []

  for (const org of orgs) {
    if (strategy === "perSubdivisionIfAny" && org.subdivisions.length > 0) {
      for (const sub of org.subdivisions) {
        targets.push({ organizationId: org.id, subdivisionId: sub.id })
      }
    } else {
      targets.push({ organizationId: org.id, subdivisionId: null })
    }
  }

  return targets
}

export type SelectableBatchTargetRow = BatchTarget & {
  organizationName: string
  subdivisionName: string | null
}

export function listSelectableBatchTargets(
  orgs: SupervisedOrg[]
): SelectableBatchTargetRow[] {
  const orgMap = new Map(orgs.map((org) => [org.id, org]))

  return expandBatchTargets(orgs).map((target) => {
    const org = orgMap.get(target.organizationId)!
    const subdivision =
      target.subdivisionId != null
        ? org.subdivisions.find((sub) => sub.id === target.subdivisionId)
        : null

    return {
      ...target,
      organizationName: org.name,
      subdivisionName: subdivision?.name ?? null,
    }
  })
}

export function selectableTargetKey(target: SelectableBatchTargetRow): string {
  return targetKey(target)
}

export function dedupeBatchTargets(targets: BatchTarget[]): BatchTarget[] {
  const seen = new Set<string>()
  return targets.filter((target) => {
    const key = `${target.organizationId}:${target.subdivisionId ?? "null"}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function targetKey(target: BatchTarget): string {
  return `${target.organizationId}:${target.subdivisionId ?? "null"}`
}

export function hasOrgSubdivisionConflict(targets: BatchTarget[]): boolean {
  const orgLevel = new Set<number>()
  const subdivisionsByOrg = new Set<string>()

  for (const target of targets) {
    if (target.subdivisionId == null) {
      orgLevel.add(target.organizationId)
    } else {
      subdivisionsByOrg.add(`${target.organizationId}:${target.subdivisionId}`)
    }
  }

  for (const target of targets) {
    if (target.subdivisionId != null && orgLevel.has(target.organizationId)) {
      return true
    }
  }

  return false
}
