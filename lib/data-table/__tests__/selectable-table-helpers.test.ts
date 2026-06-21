import { describe, expect, it, vi } from "vitest"
import { selectAllFiltered, toggleInSet } from "@/lib/data-table/selectable-table-helpers"

describe("selectAllFiltered", () => {
  it("adds all filtered row keys", () => {
    const onSelectionChange = vi.fn()
    const table = {
      getFilteredRowModel: () => ({
        rows: [{ original: { id: 1 } }, { original: { id: 2 } }],
      }),
    } as never

    selectAllFiltered(table, (row: { id: number }) => row.id, new Set(), onSelectionChange)
    expect(onSelectionChange).toHaveBeenCalledWith(new Set([1, 2]))
  })
})

describe("toggleInSet", () => {
  it("adds key when absent", () => {
    const next = toggleInSet(new Set(["a"]), "b")
    expect(next.has("a")).toBe(true)
    expect(next.has("b")).toBe(true)
  })

  it("removes key when present", () => {
    const next = toggleInSet(new Set(["a", "b"]), "b")
    expect(next.has("b")).toBe(false)
    expect(next.has("a")).toBe(true)
  })

  it("does not mutate original set", () => {
    const original = new Set(["x"])
    toggleInSet(original, "y")
    expect(original.has("y")).toBe(false)
  })

  it("supports numeric keys", () => {
    const next = toggleInSet(new Set<number>([1]), 2)
    expect([...next]).toEqual([1, 2])
  })
})
