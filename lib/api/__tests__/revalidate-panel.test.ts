import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRevalidatePath = vi.hoisted(() => vi.fn())
const mockInvalidateKeys = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockInvalidateDashboard = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}))

vi.mock("@/lib/cache/json-cache", () => ({
  invalidateKeys: mockInvalidateKeys,
}))

vi.mock("@/lib/dashboard/invalidate-on-mutation", () => ({
  invalidateDashboardOnMutation: mockInvalidateDashboard,
}))

import {
  revalidatePanelDashboard,
  revalidatePanelDelayRequests,
  revalidatePanelMeasures,
  revalidatePanelOrder,
  revalidatePanelOrderMutation,
  revalidatePanelOrganizations,
  revalidatePanelResponses,
  revalidatePanelSettings,
  revalidatePanelUsers,
} from "@/lib/api/revalidate-panel"

describe("revalidatePanelDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("invalidates dashboard cache and panel path", async () => {
    await revalidatePanelDashboard()
    expect(mockInvalidateDashboard).toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel")
  })
})

describe("revalidatePanelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("invalidates orders list and order detail", async () => {
    await revalidatePanelOrder(5)
    expect(mockInvalidateKeys).toHaveBeenCalledWith("list:orders")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/orders")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/orders/5")
  })
})

describe("revalidatePanelOrderMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("revalidates responses and delays when requested", async () => {
    await revalidatePanelOrderMutation(3, {
      responses: true,
      delays: true,
      responseId: 9,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/responses")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/responses/9")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/delay-requests")
  })
})

describe("revalidatePanelUsers", () => {
  it("revalidates user settings paths", async () => {
    vi.clearAllMocks()
    await revalidatePanelUsers(2)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/settings/users")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/settings/users/2/edit")
  })
})

describe("revalidatePanelSettings", () => {
  it("revalidates settings hub paths", () => {
    vi.clearAllMocks()
    revalidatePanelSettings()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/settings")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/settings/general")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/settings/account")
  })
})

describe("revalidatePanelResponses", () => {
  it("revalidates responses path", () => {
    vi.clearAllMocks()
    revalidatePanelResponses()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/responses")
  })
})

describe("revalidatePanelDelayRequests", () => {
  it("revalidates delay requests path", () => {
    vi.clearAllMocks()
    revalidatePanelDelayRequests()
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/delay-requests")
  })
})

describe("revalidatePanelMeasures", () => {
  it("invalidates measures cache and paths", () => {
    vi.clearAllMocks()
    revalidatePanelMeasures(4)
    expect(mockInvalidateKeys).toHaveBeenCalledWith("list:measures")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/measures")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/measures/4/edit")
  })
})

describe("revalidatePanelOrganizations", () => {
  it("revalidates organization paths", () => {
    vi.clearAllMocks()
    revalidatePanelOrganizations(8)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/organizations")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/organizations/8")
  })
})
