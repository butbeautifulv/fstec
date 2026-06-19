"use client"

import { APP_NAME, labels } from "@/lib/ui/branding"
import {
  ShellBreadcrumb,
  ShellBreadcrumbProvider,
  useShellBreadcrumbLabel,
  type ShellCrumb,
} from "@/components/shell/shell-breadcrumb"

export { ShellBreadcrumbProvider as AdminBreadcrumbProvider }

export function useAdminBreadcrumbLabel(label: string | null) {
  useShellBreadcrumbLabel(label)
}

function buildAdminCrumbs(pathname: string, dynamicLabel: string | null): ShellCrumb[] {
  const crumbs: ShellCrumb[] = [{ label: APP_NAME, href: "/admin" }]

  if (pathname === "/admin") {
    crumbs.push({ label: "Сводка" })
    return crumbs
  }

  if (pathname.startsWith("/admin/measures")) {
    crumbs.push({ label: "Меры", href: "/admin/measures" })
    if (pathname === "/admin/measures/new") crumbs.push({ label: "Новая мера" })
    else if (pathname.endsWith("/edit")) crumbs.push({ label: "Редактирование" })
    return crumbs
  }

  if (pathname.startsWith("/admin/orders")) {
    crumbs.push({ label: "Поручения", href: "/admin/orders" })
    if (pathname === "/admin/orders/new") crumbs.push({ label: "Создание" })
    else if (pathname !== "/admin/orders") {
      crumbs.push({ label: dynamicLabel ?? "Поручение" })
    }
    return crumbs
  }

  if (pathname.startsWith("/admin/organizations")) {
    crumbs.push({ label: labels.orgs, href: "/admin/organizations" })
    if (pathname !== "/admin/organizations") {
      crumbs.push({ label: dynamicLabel ?? labels.org })
    }
    return crumbs
  }

  crumbs.push({ label: "Раздел" })
  return crumbs
}

export function AdminBreadcrumb() {
  return <ShellBreadcrumb buildCrumbs={buildAdminCrumbs} />
}
