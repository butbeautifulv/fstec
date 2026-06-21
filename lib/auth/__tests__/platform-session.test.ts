import { describe, expect, it } from "vitest"
import { buildPlatformSessionUser } from "@/lib/auth/platform-session"
import { Permission } from "@/lib/auth/permissions"

describe("buildPlatformSessionUser", () => {
  it("maps user fields and attaches role permissions", () => {
    const session = buildPlatformSessionUser({
      id: 42,
      email: "operator@example.com",
      name: "Operator User",
      role: "OPERATOR",
    })

    expect(session).toEqual({
      id: 42,
      email: "operator@example.com",
      name: "Operator User",
      role: "OPERATOR",
      permissions: expect.arrayContaining([
        Permission.ordersRead,
        Permission.ordersWrite,
      ]),
    })
    expect(session.permissions).not.toContain(Permission.settingsWrite)
  })

  it("grants all permissions to SUPER_ADMIN", () => {
    const session = buildPlatformSessionUser({
      id: 1,
      email: "admin@example.com",
      name: "Admin",
      role: "SUPER_ADMIN",
    })

    expect(session.permissions).toContain(Permission.settingsWrite)
    expect(session.permissions).toContain(Permission.usersManage)
  })

  it("restricts VIEWER to read permissions", () => {
    const session = buildPlatformSessionUser({
      id: 3,
      email: "viewer@example.com",
      name: "Viewer",
      role: "VIEWER",
    })

    expect(session.permissions).toContain(Permission.ordersRead)
    expect(session.permissions).not.toContain(Permission.ordersWrite)
  })
})
