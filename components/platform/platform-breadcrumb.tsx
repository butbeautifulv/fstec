"use client"

import { APP_NAME, labels } from "@/lib/ui/branding"
import {
  ShellBreadcrumb,
  ShellBreadcrumbProvider,
  useShellBreadcrumbLabel,
  useShellBreadcrumbMiddle,
  type ShellCrumb,
} from "@/components/shell/shell-breadcrumb"

export { ShellBreadcrumbProvider as PlatformBreadcrumbProvider }

export function usePlatformBreadcrumbLabel(label: string | null) {
  useShellBreadcrumbLabel(label)
}

export function usePlatformBreadcrumbMiddle(crumbs: ShellCrumb[]) {
  useShellBreadcrumbMiddle(crumbs)
}

/** @deprecated Use usePlatformBreadcrumbLabel */
export const useAdminBreadcrumbLabel = usePlatformBreadcrumbLabel

/** @deprecated Use usePlatformBreadcrumbMiddle */
export const useAdminBreadcrumbMiddle = usePlatformBreadcrumbMiddle

function buildPlatformCrumbs(
  pathname: string,
  dynamicLabel: string | null,
  middleCrumbs: ShellCrumb[]
): ShellCrumb[] {
  const crumbs: ShellCrumb[] = [{ label: APP_NAME, href: "/panel" }]

  if (pathname === "/panel") {
    crumbs.push({ label: "Сводка" })
    return crumbs
  }

  if (pathname.startsWith("/panel/measures")) {
    crumbs.push({ label: "Меры", href: "/panel/measures" })
    if (pathname === "/panel/measures/new") crumbs.push({ label: "Новая мера" })
    else if (pathname.endsWith("/edit")) crumbs.push({ label: "Редактирование" })
    return crumbs
  }

  if (pathname.startsWith("/panel/orders")) {
    crumbs.push({ label: "Поручения", href: "/panel/orders" })
    if (pathname === "/panel/orders/new") {
      crumbs.push({ label: "Создание" })
    } else if (pathname.match(/^\/panel\/orders\/\d+\/edit$/)) {
      crumbs.push(...middleCrumbs)
      crumbs.push({ label: "Редактирование" })
    } else if (pathname.includes("/items/")) {
      crumbs.push(...middleCrumbs)
      crumbs.push({ label: dynamicLabel ?? "Позиция" })
    } else if (pathname !== "/panel/orders") {
      crumbs.push({ label: dynamicLabel ?? "Поручение" })
    }
    return crumbs
  }

  if (pathname.startsWith("/panel/organizations")) {
    crumbs.push({ label: labels.orgs, href: "/panel/organizations" })
    if (pathname === "/panel/organizations/new") {
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
    if (pathname !== "/panel/organizations") {
      crumbs.push({ label: dynamicLabel ?? labels.org })
    }
    return crumbs
  }

  if (pathname.startsWith("/panel/delay-requests")) {
    crumbs.push({ label: "Переносы", href: "/panel/delay-requests" })
    if (pathname !== "/panel/delay-requests") {
      crumbs.push({ label: dynamicLabel ?? "Заявка" })
    }
    return crumbs
  }

  if (pathname.startsWith("/panel/settings")) {
    crumbs.push({ label: "Настройки", href: "/panel/settings" })
    if (pathname === "/panel/settings/general") {
      crumbs.push({ label: "Общие" })
    } else if (pathname === "/panel/settings/account") {
      crumbs.push({ label: "Учётная запись" })
    } else if (pathname === "/panel/settings/auth") {
      crumbs.push({ label: "Аутентификация" })
    } else if (pathname === "/panel/settings/users") {
      crumbs.push({ label: "Пользователи" })
    } else if (pathname === "/panel/settings/users/new") {
      crumbs.push({ label: "Пользователи", href: "/panel/settings/users" })
      crumbs.push({ label: "Новый пользователь" })
    } else if (pathname.match(/^\/panel\/settings\/users\/\d+\/edit$/)) {
      crumbs.push({ label: "Пользователи", href: "/panel/settings/users" })
      crumbs.push({ label: "Редактирование" })
    }
    return crumbs
  }

  if (pathname.startsWith("/panel/responses")) {
    crumbs.push(...middleCrumbs)
    crumbs.push({ label: dynamicLabel ?? "Отчёт" })
    return crumbs
  }

  crumbs.push({ label: "Раздел" })
  return crumbs
}

export function PlatformBreadcrumb() {
  return <ShellBreadcrumb buildCrumbs={buildPlatformCrumbs} />
}

/** @deprecated Use PlatformBreadcrumb */
export const AdminBreadcrumb = PlatformBreadcrumb
