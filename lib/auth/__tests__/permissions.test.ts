import { describe, expect, it } from "vitest"
import {
  getPermissionsForRole,
  hasAnyPermission,
  hasPermission,
  normalizeRole,
  Permission,
} from "@/lib/auth/permissions"

describe("normalizeRole", () => {
  it("maps legacy ADMIN to SUPER_ADMIN", () => {
    expect(normalizeRole("ADMIN")).toBe("SUPER_ADMIN")
  })

  it("returns null for unknown role", () => {
    expect(normalizeRole("UNKNOWN")).toBeNull()
    expect(normalizeRole(null)).toBeNull()
    expect(normalizeRole(undefined)).toBeNull()
  })

  it("passes through valid roles", () => {
    expect(normalizeRole("OPERATOR")).toBe("OPERATOR")
    expect(normalizeRole("VIEWER")).toBe("VIEWER")
  })
})

describe("hasPermission", () => {
  it("grants all permissions to SUPER_ADMIN", () => {
    expect(hasPermission("SUPER_ADMIN", Permission.settingsWrite)).toBe(true)
    expect(hasPermission("SUPER_ADMIN", Permission.usersManage)).toBe(true)
  })

  it("restricts VIEWER to read permissions", () => {
    expect(hasPermission("VIEWER", Permission.ordersRead)).toBe(true)
    expect(hasPermission("VIEWER", Permission.ordersWrite)).toBe(false)
  })

  it("allows OPERATOR write on operational resources", () => {
    expect(hasPermission("OPERATOR", Permission.ordersWrite)).toBe(true)
    expect(hasPermission("OPERATOR", Permission.settingsWrite)).toBe(false)
  })

  it("returns false for invalid role", () => {
    expect(hasPermission("GUEST", Permission.ordersRead)).toBe(false)
  })
})

describe("getPermissionsForRole", () => {
  it("returns empty list for unknown role", () => {
    expect(getPermissionsForRole("INVALID")).toEqual([])
  })

  it("returns viewer permissions", () => {
    expect(getPermissionsForRole("VIEWER")).toContain(Permission.measuresRead)
    expect(getPermissionsForRole("VIEWER")).not.toContain(Permission.measuresWrite)
  })
})

describe("hasAnyPermission", () => {
  it("returns true when at least one permission matches", () => {
    expect(
      hasAnyPermission("VIEWER", [Permission.ordersWrite, Permission.ordersRead])
    ).toBe(true)
  })

  it("returns false for empty permission list", () => {
    expect(hasAnyPermission("SUPER_ADMIN", [])).toBe(false)
  })
})
