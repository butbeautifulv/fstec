"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  Globe,
  KeyRound,
  Settings2,
  UserCircle,
  Users,
} from "lucide-react"
import { useAdminMe } from "@/components/admin/use-admin-me"
import { Permission } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"

type SettingsNavItem = {
  href: string
  title: string
  description: string
  icon: typeof Settings2
  permission?: Permission
  always?: boolean
}

const items: SettingsNavItem[] = [
  {
    href: "/admin/settings/general",
    title: "Общие",
    description: "Головная организация, часовой пояс и язык системы",
    icon: Settings2,
    permission: Permission.settingsWrite,
  },
  {
    href: "/admin/settings/account",
    title: "Учётная запись",
    description: "Имя, email, пароль и личный язык",
    icon: UserCircle,
    always: true,
  },
  {
    href: "/admin/settings/users",
    title: "Пользователи",
    description: "Управление учётными записями и ролями",
    icon: Users,
    permission: Permission.usersManage,
  },
  {
    href: "/admin/settings/auth",
    title: "Аутентификация",
    description: "Провайдеры входа: локальный, Active Directory, Keycloak",
    icon: KeyRound,
    permission: Permission.settingsWrite,
  },
]

export function SettingsNav() {
  const pathname = usePathname()
  const { can } = useAdminMe()

  const visible = items.filter(
    (item) => item.always === true || (item.permission != null && can(item.permission))
  )

  return (
    <div className="flex flex-col gap-2">
      {visible.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-muted/50",
              active && "border-primary/30 bg-muted/30"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )
      })}
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">Нет доступных разделов настроек.</p>
      )}
    </div>
  )
}

export function SettingsNavCompact() {
  const { can } = useAdminMe()
  if (!can(Permission.settingsWrite)) return null

  return (
    <Link
      href="/admin/settings/general"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <Globe className="size-3.5" />
      Системные настройки
    </Link>
  )
}
