"use client"

import { usePathname } from "next/navigation"
import {
  Building2Icon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ShieldIcon,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { ShellSidebar, type ShellSidebarLink } from "@/components/shell/shell-sidebar"
import { APP_NAME, APP_TAGLINE, labels } from "@/lib/ui/branding"

const links: ShellSidebarLink[] = [
  { href: "/admin", label: "Сводка", icon: LayoutDashboardIcon },
  { href: "/admin/measures", label: "Меры", icon: ShieldIcon },
  { href: "/admin/orders", label: "Поручения", icon: ClipboardListIcon },
  { href: "/admin/organizations", label: labels.orgs, icon: Building2Icon },
]

const adminUser = {
  name: "Администратор",
  email: "admin@fstec.local",
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <ShellSidebar
      variant="inset"
      brand={{ href: "/admin", title: APP_NAME, subtitle: APP_TAGLINE, icon: ShieldIcon }}
      links={links}
      pathname={pathname}
      isLinkActive={(link, path) =>
        link.href === "/admin"
          ? path === "/admin"
          : path === link.href || path.startsWith(`${link.href}/`)
      }
      primaryAction={{
        href: "/admin/orders/new",
        label: "Создать поручение",
        icon: PlusIcon,
      }}
      footer={<NavUser user={adminUser} />}
    />
  )
}
