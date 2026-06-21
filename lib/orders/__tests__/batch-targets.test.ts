import assert from "node:assert/strict"
import {
  expandBatchTargets,
  hasOrgSubdivisionConflict,
  listSelectableBatchTargets,
  targetKey,
} from "../batch-targets"

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

function main() {
  const selectable = listSelectableBatchTargets(orgs)
  assert.equal(selectable.length, 3)
  assert.deepEqual(
    selectable.map((row) => targetKey(row)),
    ["1:10", "1:11", "2:null"]
  )
  assert.equal(selectable[0]?.organizationName, "Org A")
  assert.equal(selectable[0]?.subdivisionName, "Sub A1")
  assert.equal(selectable[2]?.subdivisionName, null)

  const expanded = expandBatchTargets(orgs)
  assert.equal(hasOrgSubdivisionConflict(expanded), false)

  assert.equal(
    hasOrgSubdivisionConflict([
      { organizationId: 1, subdivisionId: null },
      { organizationId: 1, subdivisionId: 10 },
    ]),
    true
  )

  assert.equal(
    hasOrgSubdivisionConflict([
      { organizationId: 1, subdivisionId: 10 },
      { organizationId: 1, subdivisionId: 11 },
    ]),
    false
  )

  console.log("All batch-targets checks passed.")
}

main()
