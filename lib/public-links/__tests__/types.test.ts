import { describe, expect, it } from "vitest"
import {
  organizationLinkScopeKey,
  parseLinkScopeKey,
  subdivisionLinkScopeKey,
} from "@/lib/public-links/types"

describe("link scope keys", () => {
  it("parses valid keys", () => {
    expect(parseLinkScopeKey("report")).toBe("report")
    expect(parseLinkScopeKey("org:7")).toBe("organization")
    expect(parseLinkScopeKey("sub:49")).toBe("subdivision")
    expect(parseLinkScopeKey("invalid")).toBeNull()
  })

  it("builds stable keys", () => {
    expect(organizationLinkScopeKey(7)).toBe("org:7")
    expect(subdivisionLinkScopeKey(49)).toBe("sub:49")
  })
})
