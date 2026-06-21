import { describe, expect, it } from "vitest"
import { Permission } from "@/lib/auth/permissions"
import { buildAdminOrdersNavItem } from "@/lib/nav/build-nav-orders"
import {
  buildPlatformNavItems,
  filterNavByPermission,
  PLATFORM_BRAND_HREF,
  PLATFORM_PRIMARY_ACTION,
} from "@/lib/nav/platform-nav"
import {
  formatOrderIssuedDescription,
  scopedOrderDetailConfig,
  scopedOrderDetailMiddleCrumbs,
  scopedOrdersBasePath,
  scopedOrdersListConfig,
} from "@/lib/nav/scoped-orders-config"

describe("buildAdminOrdersNavItem", () => {
  it("marks active when pathname starts with orders", () => {
    const item = buildAdminOrdersNavItem("/panel/orders/5")
    expect(item).toMatchObject({
      title: "Поручения",
      href: "/panel/orders",
      isActive: true,
    })
  })

  it("is inactive on unrelated paths", () => {
    const item = buildAdminOrdersNavItem("/panel/measures")
    expect(item.isActive).toBe(false)
  })
})

describe("scopedOrdersBasePath", () => {
  it("returns public path", () => {
    expect(scopedOrdersBasePath({ scope: "public", token: "abc" })).toBe("/p/abc")
  })

  it("returns report path", () => {
    expect(
      scopedOrdersBasePath({ scope: "report", token: "xyz", organizationName: "Org" })
    ).toBe("/report/xyz")
  })
})

describe("scopedOrdersListConfig", () => {
  it("returns public list config", () => {
    expect(scopedOrdersListConfig({ scope: "public", token: "tok" })).toEqual({
      basePath: "/p/tok",
      title: "Поручения",
      description: "Список поручений по исполнению мер",
      backHref: "/p/tok",
      backLabel: "Сводка",
      searchPlaceholder: undefined,
    })
  })

  it("returns report list config", () => {
    expect(
      scopedOrdersListConfig({
        scope: "report",
        token: "tok",
        organizationName: "Org Alpha",
      })
    ).toEqual({
      basePath: "/report/tok",
      title: "Org Alpha",
      description: "Поручения организации",
      backHref: "/report/tok",
      backLabel: "Назад к сводке",
      searchPlaceholder: "Поиск по поручению…",
    })
  })
})

describe("formatOrderIssuedDescription", () => {
  it("formats issued date in Russian locale style", () => {
    expect(formatOrderIssuedDescription("2024-03-15T00:00:00.000Z")).toBe(
      "Выдано 15.03.2024"
    )
  })
})

describe("scopedOrderDetailConfig", () => {
  const order = { title: "Order X", issuedAt: "2024-03-15T00:00:00.000Z" }

  it("returns public detail config", () => {
    expect(scopedOrderDetailConfig({ scope: "public", token: "tok" }, order)).toEqual({
      basePath: "/p/tok",
      title: "Order X",
      description: "Выдано 15.03.2024",
      backHref: "/p/tok/orders",
      backLabel: "Поручения",
      actionLabel: "Заполнить",
    })
  })

  it("returns report detail config", () => {
    expect(
      scopedOrderDetailConfig(
        { scope: "report", token: "tok", organizationName: "Org Alpha" },
        order
      )
    ).toEqual({
      basePath: "/report/tok",
      title: "Order X",
      description: "Организация: Org Alpha · выдано 15.03.2024",
      backHref: "/report/tok",
      backLabel: "Назад к сводке",
      actionLabel: undefined,
    })
  })

  it("uses override organization name in report scope", () => {
    const config = scopedOrderDetailConfig(
      { scope: "report", token: "tok", organizationName: "Default Org" },
      order,
      "Override Org"
    )
    expect(config.description).toContain("Override Org")
  })
})

describe("scopedOrderDetailMiddleCrumbs", () => {
  it("returns crumbs for public scope", () => {
    expect(
      scopedOrderDetailMiddleCrumbs(
        { scope: "public", token: "tok" },
        { id: 5, title: "Order X" }
      )
    ).toEqual([
      { label: "Сводка", href: "/p/tok" },
      { label: "Поручения", href: "/p/tok/orders" },
      { label: "Order X", href: "/p/tok/orders/5" },
    ])
  })

  it("returns null for report scope", () => {
    expect(
      scopedOrderDetailMiddleCrumbs(
        { scope: "report", token: "tok", organizationName: "Org" },
        { id: 5, title: "Order X" }
      )
    ).toBeNull()
  })
})

describe("buildPlatformNavItems", () => {
  it("marks dashboard active on /panel", () => {
    const items = buildPlatformNavItems("/panel")
    const dashboard = items.find((i) => i.href === "/panel")
    expect(dashboard?.isActive).toBe(true)
    expect(dashboard?.title).toBe("Сводка")
  })

  it("marks measures active but not imports subpath conflict", () => {
    const measures = buildPlatformNavItems("/panel/measures").find(
      (i) => i.href === "/panel/measures"
    )
    expect(measures?.isActive).toBe(true)

    const imports = buildPlatformNavItems("/panel/measures/imports").find(
      (i) => i.href === "/panel/measures"
    )
    expect(imports?.isActive).toBe(false)
  })

  it("marks imports nav active on imports path", () => {
    const imports = buildPlatformNavItems("/panel/measures/imports/new").find(
      (i) => i.href === "/panel/measures/imports"
    )
    expect(imports?.isActive).toBe(true)
  })

  it("includes permission on each item", () => {
    const items = buildPlatformNavItems("/panel")
    expect(items.every((i) => i.permission != null)).toBe(true)
  })
})

describe("filterNavByPermission", () => {
  const items = [
    { title: "A", permission: Permission.ordersRead },
    { title: "B", permission: Permission.measuresRead },
    { title: "C" },
  ]

  it("filters items by permission", () => {
    const filtered = filterNavByPermission(items, (p) => p === Permission.ordersRead)
    expect(filtered.map((i) => i.title)).toEqual(["A", "C"])
  })

  it("keeps items without permission requirement", () => {
    const filtered = filterNavByPermission(items, () => false)
    expect(filtered.map((i) => i.title)).toEqual(["C"])
  })
})

describe("platform constants", () => {
  it("exports primary action and brand href", () => {
    expect(PLATFORM_PRIMARY_ACTION).toEqual({
      href: "/panel/measures/imports/new",
      label: "Импортировать меры из DOCX",
      permission: Permission.measuresWrite,
    })
    expect(PLATFORM_BRAND_HREF).toBe("/panel")
  })
})
