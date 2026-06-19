"use client"

import {
  ShellBreadcrumb,
  useShellBreadcrumbLabel,
  type ShellCrumb,
} from "@/components/shell/shell-breadcrumb"

export { ShellBreadcrumbProvider as PublicBreadcrumbProvider } from "@/components/shell/shell-breadcrumb"

export function usePublicBreadcrumbLabel(label: string | null) {
  useShellBreadcrumbLabel(label)
}

function extractToken(pathname: string): string | null {
  const match = pathname.match(/^\/p\/([^/]+)/)
  return match?.[1] ?? null
}

export function buildPublicCrumbs(
  pathname: string,
  dynamicLabel: string | null,
  organizationName: string
): ShellCrumb[] {
  const token = extractToken(pathname)
  const baseHref = token ? `/p/${token}` : undefined
  const crumbs: ShellCrumb[] = [{ label: organizationName, href: baseHref }]

  if (pathname === baseHref || pathname === `${baseHref}/`) {
    crumbs.push({ label: "Сводка" })
    return crumbs
  }

  if (pathname.includes("/items/")) {
    crumbs.push({ label: "Сводка", href: baseHref })
    crumbs.push({ label: dynamicLabel ?? "Мера" })
    return crumbs
  }

  crumbs.push({ label: "Раздел" })
  return crumbs
}

export function PublicBreadcrumb({ organizationName }: { organizationName: string }) {
  return (
    <ShellBreadcrumb
      buildCrumbs={(pathname, dynamicLabel) =>
        buildPublicCrumbs(pathname, dynamicLabel, organizationName)
      }
    />
  )
}
