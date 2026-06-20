"use client"

import { APP_NAME, labels } from "@/lib/ui/branding"
import {
  ShellBreadcrumb,
  ShellBreadcrumbProvider,
  useShellBreadcrumbLabel,
  useShellBreadcrumbMiddle,
  type ShellCrumb,
} from "@/components/shell/shell-breadcrumb"

export { ShellBreadcrumbProvider as AdminBreadcrumbProvider }

export function useAdminBreadcrumbLabel(label: string | null) {
  useShellBreadcrumbLabel(label)
}

export function useAdminBreadcrumbMiddle(crumbs: ShellCrumb[]) {
  useShellBreadcrumbMiddle(crumbs)
}

function buildAdminCrumbs(
  pathname: string,
  dynamicLabel: string | null,
  middleCrumbs: ShellCrumb[]
): ShellCrumb[] {
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
    if (pathname === "/admin/organizations/new") {
      crumbs.push({ label: `Новая ${labels.org.toLowerCase()}` })
      return crumbs
    }
    if (pathname.includes("/subdivisions/")) {
      crumbs.push(...middleCrumbs)
      if (pathname.endsWith("/subdivisions/new")) {
        crumbs.push({ label: "Новое подразделение" })
      } else if (pathname.endsWith("/edit")) {
        crumbs.push({ label: "Редактирование подразделения" })
      }
      return crumbs
    }
    if (pathname.endsWith("/edit")) {
      crumbs.push(...middleCrumbs)
      crumbs.push({ label: "Редактирование" })
      return crumbs
    }
    if (pathname !== "/admin/organizations") {
      crumbs.push({ label: dynamicLabel ?? labels.org })
    }
    return crumbs
  }

  if (pathname.startsWith("/admin/delay-requests")) {
    crumbs.push({ label: "Переносы", href: "/admin/delay-requests" })
    if (pathname !== "/admin/delay-requests") {
      crumbs.push({ label: dynamicLabel ?? "Заявка" })
    }
    return crumbs
  }

  if (pathname.startsWith("/admin/settings")) {
    crumbs.push({ label: "Настройки", href: "/admin/settings" })
    if (pathname === "/admin/settings/general") {
      crumbs.push({ label: "Общие" })
    } else if (pathname === "/admin/settings/account") {
      crumbs.push({ label: "Учётная запись" })
    } else if (pathname === "/admin/settings/auth") {
      crumbs.push({ label: "Аутентификация" })
    } else if (pathname === "/admin/settings/users") {
      crumbs.push({ label: "Пользователи" })
    } else if (pathname === "/admin/settings/users/new") {
      crumbs.push({ label: "Пользователи", href: "/admin/settings/users" })
      crumbs.push({ label: "Новый пользователь" })
    } else if (pathname.match(/^\/admin\/settings\/users\/\d+\/edit$/)) {
      crumbs.push({ label: "Пользователи", href: "/admin/settings/users" })
      crumbs.push({ label: "Редактирование" })
    }
    return crumbs
  }

  if (pathname.startsWith("/admin/responses")) {
    crumbs.push(...middleCrumbs)
    crumbs.push({ label: dynamicLabel ?? "Отчёт" })
    return crumbs
  }

  crumbs.push({ label: "Раздел" })
  return crumbs
}

export function AdminBreadcrumb() {
  return <ShellBreadcrumb buildCrumbs={buildAdminCrumbs} />
}
