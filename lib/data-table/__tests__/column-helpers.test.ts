import { describe, expect, it } from "vitest"
import type { ColumnDef, Row } from "@tanstack/react-table"
import {
  ACTIONS_COLUMN_ID,
  actionsColumnMeta,
  colMeta,
  isActionsColumn,
  textColumnMeta,
} from "@/lib/data-table/column-meta"
import {
  clampColumnVisibility,
  countVisibleColumns,
  getColumnDefId,
  getColumnDefIds,
  minVisibleColumnCount,
} from "@/lib/data-table/column-visibility"
import { buildVisibleColumnWidths, stripPercentWidthClass } from "@/lib/data-table/column-width"
import { dateSortFn, numberSortFn } from "@/lib/data-table/sort-helpers"

describe("colMeta", () => {
  it("includes faceted meta by default", () => {
    expect(colMeta("Title")).toEqual({ faceted: true, title: "Title" })
  })

  it("omits faceted when disabled", () => {
    expect(colMeta("Title", { faceted: false })).toEqual({ title: "Title" })
  })

  it("passes through optional fields", () => {
    expect(
      colMeta("Status", {
        valueType: "date",
        valueLabels: { open: "Open" },
        cellClassName: "w-full",
      })
    ).toEqual({
      faceted: true,
      title: "Status",
      valueType: "date",
      valueLabels: { open: "Open" },
      cellClassName: "w-full",
    })
  })
})

describe("textColumnMeta", () => {
  it("adds max-w-0 and width class", () => {
    expect(textColumnMeta("Org", "w-[12%]").cellClassName).toContain("max-w-0")
    expect(textColumnMeta("Org", "w-[12%]").cellClassName).toContain("w-[12%]")
  })
})

describe("actionsColumnMeta", () => {
  it("marks actions role and fixed width", () => {
    const meta = actionsColumnMeta()
    expect(meta.role).toBe("actions")
    expect(meta.faceted).toBe(false)
    expect(meta.cellClassName).toContain("w-16")
  })
})

describe("isActionsColumn", () => {
  it("detects by column id", () => {
    expect(isActionsColumn(ACTIONS_COLUMN_ID)).toBe(true)
  })

  it("detects by meta role", () => {
    expect(isActionsColumn("other", { role: "actions" })).toBe(true)
  })

  it("returns false for regular columns", () => {
    expect(isActionsColumn("name")).toBe(false)
  })
})

describe("getColumnDefId", () => {
  it("prefers explicit id", () => {
    expect(getColumnDefId({ id: "custom" }, 0)).toBe("custom")
  })

  it("falls back to accessorKey", () => {
    expect(getColumnDefId({ accessorKey: "email" }, 1)).toBe("email")
  })

  it("falls back to index", () => {
    expect(getColumnDefId({ id: "3" } as ColumnDef<unknown>, 3)).toBe("3")
  })

  it("falls back to numeric index when id and accessorKey missing", () => {
    expect(getColumnDefId({} as ColumnDef<unknown>, 7)).toBe("7")
  })
})

describe("getColumnDefIds", () => {
  it("maps all columns", () => {
    const columns: ColumnDef<unknown>[] = [
      { id: "a" },
      { accessorKey: "b" },
      { id: "2" },
    ]
    expect(getColumnDefIds(columns)).toEqual(["a", "b", "2"])
  })
})

describe("countVisibleColumns", () => {
  it("counts columns not explicitly hidden", () => {
    expect(
      countVisibleColumns(["a", "b", "c"], { b: false })
    ).toBe(2)
  })
})

describe("minVisibleColumnCount", () => {
  it("caps at column count when fewer than minimum", () => {
    expect(minVisibleColumnCount(["a"])).toBe(1)
  })

  it("uses minimum when enough columns exist", () => {
    expect(minVisibleColumnCount(["a", "b", "c"])).toBe(2)
  })
})

describe("clampColumnVisibility", () => {
  const ids = ["a", "b", "c"]

  it("accepts next state when enough columns remain visible", () => {
    const next = { a: false, b: true, c: true }
    expect(clampColumnVisibility(ids, {}, next)).toEqual(next)
  })

  it("reverts when next would hide too many columns", () => {
    const prev = { a: true, b: true, c: true }
    const next = { a: false, b: false, c: true }
    expect(clampColumnVisibility(ids, prev, next)).toEqual(prev)
  })

  it("allows hiding a column when enough remain visible", () => {
    const prev = { a: true, b: true, c: true }
    const next = { a: false, b: true, c: true }
    expect(clampColumnVisibility(ids, prev, next)).toEqual(next)
  })
})

describe("buildVisibleColumnWidths", () => {
  it("assigns fixed width to actions column", () => {
    const widths = buildVisibleColumnWidths([
      { id: "actions", meta: { role: "actions" } },
    ])
    expect(widths.get("actions")).toBe("64px")
  })

  it("distributes percent weights among flex columns", () => {
    const widths = buildVisibleColumnWidths([
      { id: "org", meta: { cellClassName: "max-w-0 w-[25%]" } },
      { id: "order", meta: { cellClassName: "max-w-0 w-[75%]" } },
    ])
    expect(widths.get("org")).toBe("25%")
    expect(widths.get("order")).toBe("75%")
  })

  it("uses fixed tailwind width when no percent weight", () => {
    const widths = buildVisibleColumnWidths([
      { id: "code", meta: { cellClassName: "w-32" } },
    ])
    expect(widths.get("code")).toBe("128px")
  })

  it("parses percent weight for flex columns", () => {
    const widths = buildVisibleColumnWidths([
      { id: "a", meta: { cellClassName: "max-w-0 w-[40%]" } },
      { id: "b", meta: { cellClassName: "max-w-0 w-[60%]" } },
    ])
    expect(widths.get("a")).toBe("40%")
    expect(widths.get("b")).toBe("60%")
  })

  it("uses calc width when flex columns share space with fixed columns", () => {
    const widths = buildVisibleColumnWidths([
      { id: "fixed", meta: { cellClassName: "w-32" } },
      { id: "flex", meta: { cellClassName: "max-w-0 w-[100%]" } },
    ])
    expect(widths.get("fixed")).toBe("128px")
    expect(widths.get("flex")).toBe("max(2rem, calc((100% - 128px) * 1))")
  })

  it.each([
    ["w-10", "40px"],
    ["w-12", "48px"],
    ["w-16", "64px"],
    ["w-24", "96px"],
    ["w-28", "112px"],
    ["w-40", "160px"],
    ["w-48", "192px"],
  ] as const)("maps tailwind class %s to %s", (twClass, expected) => {
    const widths = buildVisibleColumnWidths([
      { id: "col", meta: { cellClassName: twClass } },
    ])
    expect(widths.get("col")).toBe(expected)
  })

  it("assigns actions width alongside percent columns", () => {
    const widths = buildVisibleColumnWidths([
      { id: "name", meta: { cellClassName: "max-w-0 w-[50%]" } },
      { id: "actions", meta: { role: "actions" } },
    ])
    expect(widths.get("actions")).toBe("64px")
    expect(widths.get("name")).toBe("max(2rem, calc((100% - 64px) * 1))")
  })
})

describe("stripPercentWidthClass", () => {
  it("returns undefined for missing or empty className", () => {
    expect(stripPercentWidthClass(undefined)).toBeUndefined()
    expect(stripPercentWidthClass("")).toBeUndefined()
  })

  it("strips percent width token and trims remainder", () => {
    expect(stripPercentWidthClass("max-w-0 w-[50%] truncate")).toBe("max-w-0 truncate")
  })

  it("returns undefined when className is only percent width", () => {
    expect(stripPercentWidthClass("w-[50%]")).toBeUndefined()
  })
})

describe("parseFixedWidthPx via buildVisibleColumnWidths", () => {
  it("ignores unknown width classes", () => {
    const widths = buildVisibleColumnWidths([
      { id: "notes", meta: { cellClassName: "truncate max-w-full" } },
    ])
    expect(widths.has("notes")).toBe(false)
  })
})

function mockRow<T>(values: Record<string, unknown>): Row<T> {
  return {
    getValue: (columnId: string) => values[columnId],
  } as Row<T>
}

describe("dateSortFn", () => {
  it("sorts ISO dates ascending", () => {
    const a = mockRow({ dueAt: "2026-01-01T00:00:00.000Z" })
    const b = mockRow({ dueAt: "2026-06-01T00:00:00.000Z" })
    expect(dateSortFn(a, b, "dueAt")).toBeLessThan(0)
  })

  it("treats missing values as epoch", () => {
    const empty = mockRow({ dueAt: null })
    const dated = mockRow({ dueAt: "2026-01-01T00:00:00.000Z" })
    expect(dateSortFn(empty, dated, "dueAt")).toBeLessThan(0)
  })

  it("treats falsy values as epoch for both sides", () => {
    const emptyA = mockRow({ dueAt: undefined })
    const emptyB = mockRow({ dueAt: null })
    expect(dateSortFn(emptyA, emptyB, "dueAt")).toBe(0)
  })
})

describe("numberSortFn", () => {
  it("sorts numbers ascending", () => {
    const a = mockRow({ count: 1 })
    const b = mockRow({ count: 5 })
    expect(numberSortFn(a, b, "count")).toBeLessThan(0)
  })

  it("coerces missing values to zero", () => {
    const empty = mockRow({ count: null })
    const numbered = mockRow({ count: 3 })
    expect(numberSortFn(empty, numbered, "count")).toBeLessThan(0)
  })

  it("treats both missing values as zero", () => {
    const emptyA = mockRow({ count: undefined })
    const emptyB = mockRow({ count: null })
    expect(numberSortFn(emptyA, emptyB, "count")).toBe(0)
  })
})
