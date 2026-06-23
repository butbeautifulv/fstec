import { describe, expect, it } from "vitest"
import {
  expandDzoTargets,
  expandHeadSubdivisionTargets,
  expandImportDefaultTargets,
} from "@/lib/orders/batch-targets"

const orgs = [
  {
    id: 1,
    name: "Head",
    subdivisions: [
      { id: 10, name: "ДЦОД" },
      { id: 11, name: "ДИТСБ" },
    ],
  },
  {
    id: 2,
    name: "DZO A",
    subdivisions: [],
  },
  {
    id: 3,
    name: "DZO B",
    subdivisions: [],
  },
]

describe("batch targets head + DZO", () => {
  it("expandHeadSubdivisionTargets returns subdivision rows only for head", () => {
    const targets = expandHeadSubdivisionTargets(orgs, 1)
    expect(targets).toHaveLength(2)
    expect(targets.every((t) => t.organizationId === 1 && t.subdivisionId != null)).toBe(
      true
    )
  })

  it("expandDzoTargets returns org-level rows for non-head", () => {
    const targets = expandDzoTargets(orgs, 1)
    expect(targets).toHaveLength(2)
    expect(targets.every((t) => t.subdivisionId === null)).toBe(true)
  })

  it("expandImportDefaultTargets combines head subdivisions and DZO", () => {
    const targets = expandImportDefaultTargets(orgs, 1)
    expect(targets).toHaveLength(4)
  })
})
