import { describe, expect, it } from "vitest"
import * as columns from "@/lib/data-table/columns"

describe("data-table columns index exports", () => {
  it("exports column factories and helpers", () => {
    expect(typeof columns.createOrganizationColumn).toBe("function")
    expect(typeof columns.createOrderColumn).toBe("function")
    expect(typeof columns.createMeasureColumn).toBe("function")
    expect(typeof columns.createDueAtColumn).toBe("function")
    expect(typeof columns.createCodeColumn).toBe("function")
    expect(typeof columns.createWorkflowStatusColumn).toBe("function")
    expect(typeof columns.createMatrixWorkflowStatusColumn).toBe("function")
    expect(typeof columns.createOrderListColumns).toBe("function")
    expect(typeof columns.createOrderItemContextColumns).toBe("function")
    expect(typeof columns.orderItemContextSearchFields).toBe("function")
  })
})
