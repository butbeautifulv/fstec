import { describe, expect, it } from "vitest"
import {
  dedupeBatchTargets,
  expandBatchTargets,
  hasOrgSubdivisionConflict,
  listSelectableBatchTargets,
  selectableTargetKey,
  targetKey,
} from "@/lib/orders/batch-targets"

const orgs = [
  {
    id: 1,
    name: "Org A",
    subdivisions: [
      { id: 10, name: "Sub A1" },
      { id: 11, name: "Sub A2" },
    ],
  },
  {
    id: 2,
    name: "Org B",
    subdivisions: [],
  },
]

describe("expandBatchTargets", () => {
  it("expands orgs with subdivisions per subdivision", () => {
    expect(expandBatchTargets(orgs)).toEqual([
      { organizationId: 1, subdivisionId: 10 },
      { organizationId: 1, subdivisionId: 11 },
      { organizationId: 2, subdivisionId: null },
    ])
  })

  it("uses org-level target when no subdivisions", () => {
    expect(expandBatchTargets([orgs[1]!])).toEqual([
      { organizationId: 2, subdivisionId: null },
    ])
  })
})

describe("listSelectableBatchTargets", () => {
  it("adds organization and subdivision names", () => {
    const rows = listSelectableBatchTargets(orgs)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      organizationName: "Org A",
      subdivisionName: "Sub A1",
    })
    expect(rows[2]?.subdivisionName).toBeNull()
  })
})

describe("targetKey", () => {
  it("formats org and subdivision ids", () => {
    expect(targetKey({ organizationId: 1, subdivisionId: 10 })).toBe("1:10")
    expect(targetKey({ organizationId: 2, subdivisionId: null })).toBe("2:null")
  })

  it("matches selectableTargetKey", () => {
    const row = listSelectableBatchTargets(orgs)[0]!
    expect(selectableTargetKey(row)).toBe(targetKey(row))
  })
})

describe("dedupeBatchTargets", () => {
  it("removes duplicate targets", () => {
    const targets = [
      { organizationId: 1, subdivisionId: 10 },
      { organizationId: 1, subdivisionId: 10 },
      { organizationId: 2, subdivisionId: null },
    ]
    expect(dedupeBatchTargets(targets)).toHaveLength(2)
  })
})

describe("hasOrgSubdivisionConflict", () => {
  it("detects org-level and subdivision mix", () => {
    expect(
      hasOrgSubdivisionConflict([
        { organizationId: 1, subdivisionId: null },
        { organizationId: 1, subdivisionId: 10 },
      ])
    ).toBe(true)
  })

  it("allows multiple subdivisions of same org", () => {
    expect(
      hasOrgSubdivisionConflict([
        { organizationId: 1, subdivisionId: 10 },
        { organizationId: 1, subdivisionId: 11 },
      ])
    ).toBe(false)
  })

  it("has no conflict for expanded supervised orgs", () => {
    expect(hasOrgSubdivisionConflict(expandBatchTargets(orgs))).toBe(false)
  })
})
