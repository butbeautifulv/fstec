import { describe, expect, it } from "vitest"
import {
  serializeAccessLinks,
  serializeDelayDetail,
  serializeDelayRows,
  serializeMeasureImportDetail,
  serializeMeasureImports,
  serializeOrderDetail,
  serializeOrderForEdit,
  serializeOrderItemDelaysContext,
  serializeOrderItemEditContext,
  serializeOrderItemResponseContext,
  serializeResponseDetail,
  serializeResponseRows,
} from "@/lib/serialize/panel"

describe("serializeAccessLinks", () => {
  it("serializes link dates", () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z")
    const expiresAt = new Date("2024-12-31T00:00:00.000Z")

    expect(
      serializeAccessLinks([
        {
          id: 1,
          token: "abc",
          expiresAt,
          revokedAt: null,
          createdAt,
          subdivisionId: 5,
          subdivision: { id: 5, name: "Sub" },
        },
      ])
    ).toEqual([
      {
        id: 1,
        token: "abc",
        expiresAt: "2024-12-31T00:00:00.000Z",
        revokedAt: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        subdivisionId: 5,
        subdivision: { id: 5, name: "Sub" },
      },
    ])
  })
})

describe("serializeOrderForEdit", () => {
  it("returns id and title only", () => {
    expect(serializeOrderForEdit({ id: 3, title: "Order" })).toEqual({
      id: 3,
      title: "Order",
    })
  })
})

describe("serializeOrderItemEditContext", () => {
  it("builds edit context with serialized dates", () => {
    const dueAt = new Date("2024-07-01T00:00:00.000Z")

    expect(
      serializeOrderItemEditContext({
        id: 10,
        dueAt,
        status: { id: 1, name: "В работе", isTerminal: false },
        subdivision: { id: 2, name: "IT" },
        measure: { id: 3, name: "Measure" },
        order: {
          id: 5,
          title: "Order",
          organization: {
            subdivisions: [{ id: 2, name: "IT" }],
          },
        },
      })
    ).toEqual({
      orderId: 5,
      orderTitle: "Order",
      item: {
        id: 10,
        dueAt: "2024-07-01T00:00:00.000Z",
        status: { id: 1, name: "В работе", isTerminal: false },
        subdivision: { id: 2, name: "IT" },
        measure: { id: 3, name: "Measure" },
      },
      subdivisions: [{ id: 2, name: "IT" }],
    })
  })
})

describe("serializeOrderItemResponseContext", () => {
  it("builds response context", () => {
    expect(
      serializeOrderItemResponseContext({
        id: 10,
        measure: { id: 3, name: "Measure" },
        order: { id: 5, title: "Order" },
      })
    ).toEqual({
      orderId: 5,
      orderTitle: "Order",
      item: {
        id: 10,
        measure: { id: 3, name: "Measure" },
      },
    })
  })
})

describe("serializeOrderItemDelaysContext", () => {
  it("serializes delay requests", () => {
    const requestedDueAt = new Date("2024-08-01T00:00:00.000Z")
    const createdAt = new Date("2024-07-15T00:00:00.000Z")

    expect(
      serializeOrderItemDelaysContext({
        id: 10,
        measure: { id: 3, name: "Measure X" },
        order: { id: 5, title: "Order" },
        delayRequests: [
          {
            id: 1,
            status: "PENDING",
            requestedDueAt,
            justification: "Need more time",
            createdAt,
          },
        ],
      })
    ).toEqual({
      orderId: 5,
      orderTitle: "Order",
      measureName: "Measure X",
      delayRequests: [
        {
          id: 1,
          status: "PENDING",
          requestedDueAt: "2024-08-01T00:00:00.000Z",
          justification: "Need more time",
          createdAt: "2024-07-15T00:00:00.000Z",
        },
      ],
    })
  })
})

describe("serializeOrderDetail", () => {
  it("deep-serializes order detail objects", () => {
    const issuedAt = new Date("2024-01-01T00:00:00.000Z")
    const result = serializeOrderDetail({ id: 1, issuedAt, title: "Order" })
    expect(result).toEqual({
      id: 1,
      issuedAt: "2024-01-01T00:00:00.000Z",
      title: "Order",
    })
  })
})

describe("serializeResponseDetail", () => {
  it("deep-serializes response detail", () => {
    const submittedAt = new Date("2024-02-01T00:00:00.000Z")
    const result = serializeResponseDetail({ id: 1, submittedAt })
    expect(result).toEqual({ id: 1, submittedAt: "2024-02-01T00:00:00.000Z" })
  })
})

describe("serializeDelayDetail", () => {
  it("deep-serializes delay detail", () => {
    const createdAt = new Date("2024-03-01T00:00:00.000Z")
    const result = serializeDelayDetail({ id: 1, createdAt })
    expect(result).toEqual({ id: 1, createdAt: "2024-03-01T00:00:00.000Z" })
  })
})

describe("serializeResponseRows", () => {
  it("serializes each row", () => {
    const date = new Date("2024-04-01T00:00:00.000Z")
    const rows = serializeResponseRows([{ id: 1, createdAt: date }])
    expect(rows).toEqual([{ id: 1, createdAt: "2024-04-01T00:00:00.000Z" }])
  })
})

describe("serializeDelayRows", () => {
  it("serializes each row", () => {
    const date = new Date("2024-05-01T00:00:00.000Z")
    const rows = serializeDelayRows([{ id: 2, createdAt: date }])
    expect(rows).toEqual([{ id: 2, createdAt: "2024-05-01T00:00:00.000Z" }])
  })
})

describe("serializeMeasureImports", () => {
  it("serializes import list items", () => {
    const createdAt = new Date("2024-06-01T00:00:00.000Z")
    const reportDueAt = new Date("2024-07-01T00:00:00.000Z")

    expect(
      serializeMeasureImports([
        {
          id: 1,
          kind: "LETTER",
          status: "PARSED",
          uploadedVia: "MANUAL",
          documentNumber: "123",
          originalName: "doc.docx",
          title: "Title",
          reportDueAt,
          needsAppendix: false,
          createdAt,
          _count: { items: 2, measures: 1, orders: 0, appendices: 0 },
        },
      ])
    ).toEqual([
      {
        id: 1,
        kind: "LETTER",
        status: "PARSED",
        uploadedVia: "MANUAL",
        documentNumber: "123",
        originalName: "doc.docx",
        title: "Title",
        reportDueAt: "2024-07-01T00:00:00.000Z",
        needsAppendix: false,
        createdAt: "2024-06-01T00:00:00.000Z",
        _count: { items: 2, measures: 1, orders: 0, appendices: 0 },
      },
    ])
  })
})

describe("serializeMeasureImportDetail", () => {
  it("maps detail fields and nested items", () => {
    const reportDueAt = new Date("2024-08-01T00:00:00.000Z")

    expect(
      serializeMeasureImportDetail({
        id: 1,
        kind: "LETTER",
        status: "PARSED",
        documentNumber: "456",
        title: "Import",
        reportDueAt,
        originalName: "file.docx",
        parseError: null,
        _count: { orders: 3 },
        items: [
          {
            id: 10,
            code: "C1",
            name: "Item",
            description: null,
            tags: [],
            included: true,
            measureId: 5,
          },
        ],
      })
    ).toEqual({
      id: 1,
      kind: "LETTER",
      status: "PARSED",
      documentNumber: "456",
      title: "Import",
      reportDueAt: "2024-08-01T00:00:00.000Z",
      originalName: "file.docx",
      parseError: null,
      ordersCount: 3,
      items: [
        {
          id: 10,
          code: "C1",
          name: "Item",
          description: null,
          tags: [],
          included: true,
          measureId: 5,
        },
      ],
    })
  })
})
