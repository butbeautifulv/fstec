"use client"

import {
  ShellBreadcrumb,
  useShellBreadcrumbLabel,
  useShellBreadcrumbMiddle,
  type ShellCrumb,
} from "@/components/shell/shell-breadcrumb"

export { ShellBreadcrumbProvider as PublicBreadcrumbProvider } from "@/components/shell/shell-breadcrumb"

export function usePublicBreadcrumbLabel(label: string | null) {
  useShellBreadcrumbLabel(label)
}

export function usePublicBreadcrumbMiddle(crumbs: ShellCrumb[]) {
  useShellBreadcrumbMiddle(crumbs)
}

function extractToken(pathname: string): string | null {
  const match = pathname.match(/^\/p\/([^/]+)/)
  return match?.[1] ?? null
}

export function buildPublicCrumbs(
  pathname: string,
  dynamicLabel: string | null,
  middleCrumbs: ShellCrumb[],
  organizationName: string
): ShellCrumb[] {
  const token = extractToken(pathname)
  const baseHref = token ? `/p/${token}` : undefined
  const ordersListHref = token ? `/p/${token}/orders` : undefined
  const reportsHref = token ? `/p/${token}/reports` : undefined
  const crumbs: ShellCrumb[] = [{ label: organizationName, href: baseHref }]

  if (pathname === baseHref || pathname === `${baseHref}/`) {
    crumbs.push({ label: "Сводка" })
    return crumbs
  }

  if (
    ordersListHref &&
    (pathname === ordersListHref || pathname === `${ordersListHref}/`)
  ) {
    crumbs.push({ label: "Сводка", href: baseHref })
    crumbs.push({ label: "Поручения" })
    return crumbs
  }

  if (
    reportsHref &&
    (pathname === reportsHref || pathname === `${reportsHref}/`)
  ) {
    crumbs.push({ label: "Сводка", href: baseHref })
    crumbs.push({ label: "Отчёты" })
    return crumbs
  }

  if (pathname.includes("/orders/") || pathname.includes("/items/")) {
    crumbs.push(...middleCrumbs)
    crumbs.push({ label: dynamicLabel ?? "…" })
    return crumbs
  }

  crumbs.push({ label: "Раздел" })
  return crumbs
}

export function PublicBreadcrumb({ organizationName }: { organizationName: string }) {
  return (
    <ShellBreadcrumb
      buildCrumbs={(pathname, dynamicLabel, middleCrumbs) =>
        buildPublicCrumbs(pathname, dynamicLabel, middleCrumbs, organizationName)
      }
    />
  )
}
