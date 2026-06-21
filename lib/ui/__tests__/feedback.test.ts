import { beforeEach, describe, expect, it, vi } from "vitest"

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: mockToast,
}))

import { notify } from "@/lib/ui/feedback"

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls toast.success", () => {
    notify.success("Saved")
    expect(mockToast.success).toHaveBeenCalledWith("Saved")
  })

  it("calls toast.error", () => {
    notify.error("Failed")
    expect(mockToast.error).toHaveBeenCalledWith("Failed")
  })

  it("calls toast.info", () => {
    notify.info("Note")
    expect(mockToast.info).toHaveBeenCalledWith("Note")
  })
})
