import { describe, expect, it } from "vitest"
import {
  mapMatrixItemToPublicItem,
  mapOrderItemsToPublicItems,
  mapOrdersToPublicItems,
  mapSerializedMatrixToPublicItems,
} from "@/lib/public/map-public-items"
import {
  serializeMeasuresTableItems,
  serializeOrderListRow,
  serializeOrderListRows,
  serializePublicOrderDetail,
  serializePublicOrderSummary,
  serializePublicReportRows,
  serializePublicStatuses,
} from "@/lib/public/serialize-public"
import type { SerializedMatrixItem } from "@/lib/dashboard/serialize-dashboard"

describe("mapOrderItemsToPublicItems", () => {
  it("maps order items to public items", () => {
    const issuedAt = new Date("2024-01-15T00:00:00.000Z")
    const dueAt = new Date("2024-02-15T00:00:00.000Z")

    expect(
      mapOrderItemsToPublicItems(
        { id: 1, title: "Order A", issuedAt },
        [
          {
            id: 10,
            dueAt,
            measure: { name: "M1", code: "C1", description: "Desc" },
            status: { id: 1, name: "К исполнению", isTerminal: false },
            subdivision: { id: 3, name: "IT" },
          },
        ]
      )
    ).toEqual([
      {
        id: 10,
        orderId: 1,
        dueAt: "2024-02-15T00:00:00.000Z",
        measure: { name: "M1", code: "C1", description: "Desc" },
        status: { id: 1, name: "К исполнению", isTerminal: false },
        orderTitle: "Order A",
        orderIssuedAt: "2024-01-15T00:00:00.000Z",
        subdivisionName: "IT",
        subdivisionId: 3,
      },
    ])
  })

  it("uses null subdivisionName when subdivision is missing", () => {
    const result = mapOrderItemsToPublicItems(
      { id: 1, title: "Order", issuedAt: new Date("2024-01-01T00:00:00.000Z") },
      [
        {
          id: 10,
          dueAt: new Date("2024-02-01T00:00:00.000Z"),
          measure: { name: "M", code: null, description: null },
          status: { id: 1, name: "К исполнению", isTerminal: false },
        },
      ]
    )
    expect(result[0]?.subdivisionName).toBeNull()
  })
})

describe("mapOrdersToPublicItems", () => {
  it("flattens items from multiple orders", () => {
    const items = mapOrdersToPublicItems([
      {
        id: 1,
        title: "O1",
        issuedAt: new Date("2024-01-01T00:00:00.000Z"),
        items: [
          {
            id: 10,
            dueAt: new Date("2024-02-01T00:00:00.000Z"),
            measure: { name: "M", code: null, description: null },
            status: { id: 1, name: "К исполнению", isTerminal: false },
          },
        ],
      },
      {
        id: 2,
        title: "O2",
        issuedAt: new Date("2024-03-01T00:00:00.000Z"),
        items: [
          {
            id: 20,
            dueAt: new Date("2024-04-01T00:00:00.000Z"),
            measure: { name: "M2", code: null, description: null },
            status: { id: 2, name: "В работе", isTerminal: false },
          },
        ],
      },
    ])
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.orderId)).toEqual([1, 2])
  })
})

describe("mapMatrixItemToPublicItem", () => {
  const matrixItem: SerializedMatrixItem = {
    id: 5,
    orderId: 2,
    dueAt: "2024-05-01T00:00:00.000Z",
    isOverdue: false,
    measure: { id: 1, name: "M", code: "C", description: null },
    order: {
      title: "Order",
      issuedAt: "2024-01-01T00:00:00.000Z",
      organization: { id: 1, name: "Org" },
    },
    status: { id: 1, name: "К исполнению", isTerminal: false },
    subdivision: { id: 3, name: "Sub" },
  }

  it("maps serialized matrix item", () => {
    expect(mapMatrixItemToPublicItem(matrixItem)).toEqual({
      id: 5,
      orderId: 2,
      dueAt: "2024-05-01T00:00:00.000Z",
      measure: { name: "M", code: "C", description: null },
      status: { id: 1, name: "К исполнению", isTerminal: false },
      orderTitle: "Order",
      orderIssuedAt: "2024-01-01T00:00:00.000Z",
      subdivisionName: "Sub",
      subdivisionId: 3,
    })
  })

  it("handles Date objects in matrix item", () => {
    const withDates = {
      ...matrixItem,
      dueAt: new Date("2024-06-01T00:00:00.000Z"),
      order: {
        ...matrixItem.order,
        issuedAt: new Date("2024-02-01T00:00:00.000Z"),
      },
    }
    const result = mapMatrixItemToPublicItem({
      ...withDates,
      subdivision: matrixItem.subdivision ?? null,
    })
    expect(result.dueAt).toBe("2024-06-01T00:00:00.000Z")
    expect(result.orderIssuedAt).toBe("2024-02-01T00:00:00.000Z")
  })
})

describe("mapSerializedMatrixToPublicItems", () => {
  it("maps array of matrix items", () => {
    const items = mapSerializedMatrixToPublicItems([
      {
        id: 1,
        orderId: 1,
        dueAt: "2024-01-01T00:00:00.000Z",
        isOverdue: false,
        measure: { id: 1, name: "M", code: null, description: null },
        order: {
          title: "O",
          issuedAt: "2024-01-01T00:00:00.000Z",
          organization: { id: 1, name: "Org" },
        },
        status: { id: 1, name: "К исполнению", isTerminal: false },
        subdivision: null,
      },
    ])
    expect(items).toHaveLength(1)
    expect(items[0]?.subdivisionName).toBeNull()
  })
})

describe("serializePublicStatuses", () => {
  it("maps status fields", () => {
    expect(
      serializePublicStatuses([{ id: 1, name: "К исполнению", isTerminal: false }])
    ).toEqual([{ id: 1, name: "К исполнению", isTerminal: false }])
  })
})

describe("serializePublicOrderSummary", () => {
  it("serializes Date issuedAt", () => {
    expect(
      serializePublicOrderSummary({
        id: 1,
        title: "Order",
        issuedAt: new Date("2024-01-01T00:00:00.000Z"),
        itemCount: 3,
      })
    ).toEqual({
      id: 1,
      title: "Order",
      issuedAt: "2024-01-01T00:00:00.000Z",
      itemCount: 3,
    })
  })

  it("passes through string issuedAt", () => {
    expect(
      serializePublicOrderSummary({
        id: 1,
        title: "Order",
        issuedAt: "2024-01-01T00:00:00.000Z",
        itemCount: 1,
      }).issuedAt
    ).toBe("2024-01-01T00:00:00.000Z")
  })
})

describe("serializePublicOrderDetail", () => {
  it("serializes order detail without itemCount", () => {
    expect(
      serializePublicOrderDetail({
        id: 2,
        title: "Detail",
        issuedAt: new Date("2024-03-01T00:00:00.000Z"),
      })
    ).toEqual({
      id: 2,
      title: "Detail",
      issuedAt: "2024-03-01T00:00:00.000Z",
    })
  })

  it("passes through string issuedAt", () => {
    expect(
      serializePublicOrderDetail({
        id: 2,
        title: "Detail",
        issuedAt: "2024-03-01T00:00:00.000Z",
      }).issuedAt
    ).toBe("2024-03-01T00:00:00.000Z")
  })
})

describe("serializeOrderListRow", () => {
  it("uses itemCount when provided", () => {
    expect(
      serializeOrderListRow({
        id: 1,
        title: "O",
        issuedAt: "2024-01-01T00:00:00.000Z",
        itemCount: 5,
      }).itemCount
    ).toBe(5)
  })

  it("falls back to _count.items", () => {
    expect(
      serializeOrderListRow({
        id: 1,
        title: "O",
        issuedAt: "2024-01-01T00:00:00.000Z",
        _count: { items: 7 },
      }).itemCount
    ).toBe(7)
  })

  it("defaults itemCount to 0", () => {
    expect(
      serializeOrderListRow({
        id: 1,
        title: "O",
        issuedAt: "2024-01-01T00:00:00.000Z",
      }).itemCount
    ).toBe(0)
  })
})

describe("serializeOrderListRows", () => {
  it("maps multiple orders", () => {
    const rows = serializeOrderListRows([
      { id: 1, title: "A", issuedAt: "2024-01-01T00:00:00.000Z", itemCount: 1 },
      { id: 2, title: "B", issuedAt: "2024-02-01T00:00:00.000Z", itemCount: 2 },
    ])
    expect(rows).toHaveLength(2)
  })
})

describe("identity serializers", () => {
  it("serializeMeasuresTableItems returns items as-is", () => {
    const items = [
      {
        id: 1,
        orderId: 1,
        dueAt: "2024-01-01T00:00:00.000Z",
        measure: { name: "M", code: null, description: null },
        status: { id: 1, name: "К исполнению", isTerminal: false },
        orderTitle: "O",
        orderIssuedAt: "2024-01-01T00:00:00.000Z",
        subdivisionName: null,
      },
    ]
    expect(serializeMeasuresTableItems(items)).toBe(items)
  })

  it("serializePublicReportRows returns rows as-is", () => {
    const rows = [{ id: 1, name: "Report" }] as never
    expect(serializePublicReportRows(rows)).toBe(rows)
  })
})
