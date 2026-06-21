import { afterEach, describe, expect, it } from "vitest"
import type { ColumnDef } from "@tanstack/react-table"
import {
  createOrderItemContextColumns,
  orderItemContextSearchFields,
} from "@/lib/data-table/columns/order-item-context-columns"
import { FACETED_COLUMN_META, facetedFilterFn } from "@/lib/data-table/faceted-column"
import {
  formatFilterDisplayValue,
  normalizeFilterValue,
} from "@/lib/data-table/format-filter-value"
import { setFilterTimeZone } from "@/lib/datetime/filter-timezone"
import { DEFAULT_TIMEZONE } from "@/lib/datetime/timezones"

afterEach(() => {
  setFilterTimeZone(DEFAULT_TIMEZONE)
})

describe("FACETED_COLUMN_META", () => {
  it("marks column as faceted", () => {
    expect(FACETED_COLUMN_META).toEqual({ faceted: true })
  })
})

describe("normalizeFilterValue", () => {
  it("returns em dash for empty values", () => {
    expect(normalizeFilterValue(null)).toBe("—")
    expect(normalizeFilterValue("")).toBe("—")
  })

  it("returns label key when value has mapping", () => {
    expect(
      normalizeFilterValue("open", { valueLabels: { open: "Open" } })
    ).toBe("open")
  })

  it("normalizes date values to filter key", () => {
    setFilterTimeZone("Europe/Moscow")
    expect(
      normalizeFilterValue("2026-06-21T21:00:00.000Z", { valueType: "date" })
    ).toBe("2026-06-22")
  })

  it("normalizes Date objects to ISO for datetime", () => {
    const date = new Date("2026-06-21T12:00:00.000Z")
    expect(normalizeFilterValue(date)).toBe("2026-06-21T12:00:00.000Z")
  })

  it("returns em dash literal unchanged", () => {
    expect(normalizeFilterValue("—")).toBe("—")
  })

  it("returns invalid ISO strings unchanged", () => {
    expect(normalizeFilterValue("2026-99-99T00:00:00.000Z")).toBe(
      "2026-99-99T00:00:00.000Z"
    )
  })

  it("passes through plain strings", () => {
    expect(normalizeFilterValue("Acme Corp")).toBe("Acme Corp")
  })
})

describe("formatFilterDisplayValue", () => {
  it("returns em dash for empty values", () => {
    expect(formatFilterDisplayValue(null, undefined, "Europe/Moscow")).toBe("—")
  })

  it("uses valueLabels for display", () => {
    expect(
      formatFilterDisplayValue("done", { valueLabels: { done: "Done" } }, "Europe/Moscow")
    ).toBe("Done")
  })

  it("formats date values for display", () => {
    expect(
      formatFilterDisplayValue(
        "2026-06-21T12:00:00.000Z",
        { valueType: "date" },
        "Europe/Moscow"
      )
    ).toBe("21.06.2026")
  })

  it("formats datetime values for display", () => {
    const formatted = formatFilterDisplayValue(
      "2026-06-21T12:30:00.000Z",
      { valueType: "datetime" },
      "Europe/Moscow"
    )
    expect(formatted).toMatch(/21\.06\.2026/)
    expect(formatted).toMatch(/15:30/)
  })

  it("returns em dash for empty string", () => {
    expect(formatFilterDisplayValue("", undefined, "Europe/Moscow")).toBe("—")
  })

  it("formats ISO date without explicit valueType via isIsoDateString", () => {
    expect(
      formatFilterDisplayValue("2026-06-21T12:00:00.000Z", undefined, "Europe/Moscow")
    ).toBe("21.06.2026")
  })

  it("returns plain string for non-date values", () => {
    expect(formatFilterDisplayValue("Acme Corp", undefined, "Europe/Moscow")).toBe(
      "Acme Corp"
    )
  })

  it("formats Date object values for display", () => {
    const date = new Date("2026-06-21T12:00:00.000Z")
    expect(
      formatFilterDisplayValue(date, { valueType: "datetime" }, "Europe/Moscow")
    ).toMatch(/21\.06\.2026/)
  })
})

describe("facetedFilterFn", () => {
  function mockRow(value: unknown, meta?: Record<string, unknown>) {
    return {
      getValue: () => value,
      getAllCells: () => [
        {
          column: {
            id: "status",
            columnDef: { meta },
          },
        },
      ],
    }
  }

  const addMeta = () => {}

  it("passes when filter is empty", () => {
    expect(
      facetedFilterFn(mockRow("open") as never, "status", undefined, addMeta)
    ).toBe(true)
  })

  it("matches when normalized value is in filter set", () => {
    expect(
      facetedFilterFn(mockRow("Acme") as never, "status", ["Acme"], addMeta)
    ).toBe(true)
  })

  it("rejects when normalized value is not in filter set", () => {
    expect(
      facetedFilterFn(mockRow("Other") as never, "status", ["Acme"], addMeta)
    ).toBe(false)
  })
})

describe("createOrderItemContextColumns", () => {
  it("returns organization, order, and measure columns", () => {
    const columns = createOrderItemContextColumns(() => ({
      organization: { id: 1, name: "Org" },
      order: { id: 2, title: "Order" },
      measure: { id: 3, name: "Measure" },
    }))

    expect(columns.map((c) => c.id)).toEqual(["organization", "order", "measure"])
  })

  it("uses custom base path in href builders", () => {
    const row = { id: 99 }
    const columns = createOrderItemContextColumns(
      () => ({
        organization: { id: 1, name: "Org" },
        order: { id: 2, title: "Order" },
        measure: { id: 3, name: "Measure" },
      }),
      "/custom"
    )

    expect(columns.map((c) => c.id)).toEqual(["organization", "order", "measure"])
    type ContextRow = { id: number }
    type AccessorCol = ColumnDef<ContextRow> & {
      accessorFn?: (row: ContextRow) => string
    }
    expect((columns[0] as AccessorCol).accessorFn?.(row)).toBe("Org")
    expect((columns[1] as AccessorCol).accessorFn?.(row)).toBe("Order")
    expect((columns[2] as AccessorCol).accessorFn?.(row)).toBe("Measure")
  })
})

describe("orderItemContextSearchFields", () => {
  it("collects context names and extra fields", () => {
    expect(
      orderItemContextSearchFields(
        {
          organization: { id: 1, name: "Org A" },
          order: { id: 2, title: "Order B" },
          measure: { id: 3, name: "Measure C" },
        },
        ["extra"]
      )
    ).toEqual(["Org A", "Order B", "Measure C", "extra"])
  })
})
