import { describe, expect, it } from "vitest"
import {
  serializeForClient,
  serializeMeasures,
  serializeOrders,
  serializeStatuses,
  serializeUsers,
} from "@/lib/serialize/panel"

describe("serializeForClient", () => {
  it("converts Date values to ISO strings", () => {
    const date = new Date("2024-06-15T10:00:00.000Z")
    expect(serializeForClient({ createdAt: date })).toEqual({
      createdAt: "2024-06-15T10:00:00.000Z",
    })
  })

  it("recursively serializes nested objects and arrays", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    expect(
      serializeForClient({
        items: [{ dueAt: date }],
        meta: { updatedAt: date },
      })
    ).toEqual({
      items: [{ dueAt: "2024-01-01T00:00:00.000Z" }],
      meta: { updatedAt: "2024-01-01T00:00:00.000Z" },
    })
  })

  it("passes through primitives unchanged", () => {
    expect(serializeForClient({ id: 1, name: "test", active: true })).toEqual({
      id: 1,
      name: "test",
      active: true,
    })
  })
})

describe("serializeOrders", () => {
  it("serializes order dates and preserves nested fields", () => {
    const issuedAt = new Date("2024-03-01T12:00:00.000Z")
    const defaultDueAt = new Date("2024-04-01T12:00:00.000Z")

    expect(
      serializeOrders([
        {
          id: 1,
          title: "Order A",
          issuedAt,
          defaultDueAt,
          organization: { id: 10, name: "Org" },
          createdBy: { id: 2, name: "User" },
          _count: { items: 5 },
        },
      ])
    ).toEqual([
      {
        id: 1,
        title: "Order A",
        issuedAt: "2024-03-01T12:00:00.000Z",
        defaultDueAt: "2024-04-01T12:00:00.000Z",
        organization: { id: 10, name: "Org" },
        createdBy: { id: 2, name: "User" },
        _count: { items: 5 },
        subdivisionSummary: null,
      },
    ])
  })

  it("summarizes subdivision names from items", () => {
    expect(
      serializeOrders([
        {
          id: 3,
          title: "Order C",
          issuedAt: "2024-05-01T00:00:00.000Z",
          defaultDueAt: null,
          organization: { id: 1, name: "Org" },
          createdBy: { id: 1, name: "Admin" },
          _count: { items: 2 },
          items: [
            { subdivision: { id: 1, name: "IT" } },
            { subdivision: { id: 2, name: "HR" } },
          ],
        },
      ])
    ).toEqual([
      expect.objectContaining({
        subdivisionSummary: "HR, IT",
      }),
    ])
  })

  it("handles string dates and null defaultDueAt", () => {
    expect(
      serializeOrders([
        {
          id: 2,
          title: "Order B",
          issuedAt: "2024-05-01T00:00:00.000Z",
          defaultDueAt: null,
          organization: { id: 1, name: "Org" },
          createdBy: { id: 1, name: "Admin" },
          _count: { items: 0 },
        },
      ])
    ).toEqual([
      {
        id: 2,
        title: "Order B",
        issuedAt: "2024-05-01T00:00:00.000Z",
        defaultDueAt: null,
        organization: { id: 1, name: "Org" },
        createdBy: { id: 1, name: "Admin" },
        _count: { items: 0 },
        subdivisionSummary: null,
      },
    ])
  })
})

describe("serializeStatuses", () => {
  it("maps status fields and includes sortOrder when present", () => {
    expect(
      serializeStatuses([
        { id: 1, name: "К исполнению", isTerminal: false, sortOrder: 0 },
        { id: 2, name: "Выполнено", isTerminal: true },
      ])
    ).toEqual([
      { id: 1, name: "К исполнению", isTerminal: false, sortOrder: 0 },
      { id: 2, name: "Выполнено", isTerminal: true },
    ])
  })
})

describe("serializeMeasures", () => {
  it("serializes measure timestamps", () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z")
    const updatedAt = new Date("2024-02-01T00:00:00.000Z")

    expect(
      serializeMeasures([
        {
          id: 1,
          name: "Measure A",
          code: "M-1",
          description: "Desc",
          createdAt,
          updatedAt,
        },
      ])
    ).toEqual([
      {
        id: 1,
        name: "Measure A",
        code: "M-1",
        description: "Desc",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-02-01T00:00:00.000Z",
      },
    ])
  })
})

describe("serializeUsers", () => {
  it("serializes user createdAt to ISO string", () => {
    const createdAt = new Date("2024-06-01T08:00:00.000Z")

    expect(
      serializeUsers([
        {
          id: 1,
          email: "user@example.com",
          name: "User",
          role: "OPERATOR",
          createdAt,
        },
      ])
    ).toEqual([
      {
        id: 1,
        email: "user@example.com",
        name: "User",
        role: "OPERATOR",
        createdAt: "2024-06-01T08:00:00.000Z",
      },
    ])
  })
})
