import { beforeEach, describe, expect, it, vi } from "vitest"

const submitOrderItemResponse = vi.hoisted(() => vi.fn())

vi.mock("@/lib/responses/submit-response", () => ({ submitOrderItemResponse }))

import { handleSubmitOrderItemResponse } from "@/lib/responses/handle-submit-response"

describe("handleSubmitOrderItemResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns validation error for invalid body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ result: "" }),
    })

    const result = await handleSubmitOrderItemResponse(request, 10)

    expect(result).toHaveProperty("error")
    expect(submitOrderItemResponse).not.toHaveBeenCalled()
  })

  it("returns data on success", async () => {
    const payload = { response: { id: 1 }, item: { id: 10 } }
    submitOrderItemResponse.mockResolvedValue(payload)

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ result: "Done" }),
    })

    const result = await handleSubmitOrderItemResponse(request, 10)

    expect(result).toEqual({ data: payload })
    expect(submitOrderItemResponse).toHaveBeenCalledWith(10, { result: "Done" })
  })

  it("propagates submit errors", async () => {
    submitOrderItemResponse.mockRejectedValue(new Error("PENDING_EXISTS"))

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ result: "Done" }),
    })

    await expect(handleSubmitOrderItemResponse(request, 10)).rejects.toThrow(
      "PENDING_EXISTS"
    )
  })
})
