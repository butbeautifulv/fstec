"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Building2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type OrgNavItem = {
  href: string
  title: string
  description: string
  icon: typeof Building2
  isActive: (pathname: string, base: string) => boolean
}

function orgNavItems(organizationId: number): OrgNavItem[] {
  const base = `/panel/organizations/${organizationId}`
  return [
    {
      href: `${base}/links`,
      title: "Подразделения и ссылки",
      description: "Структура подразделений, portal- и report-ссылки",
      icon: Building2,
      isActive: (pathname, orgBase) =>
        pathname.startsWith(`${orgBase}/links`) ||
        pathname.includes(`${orgBase}/subdivisions/`),
    },
    {
      href: `${base}/contacts`,
      title: "Контакты для оповещений",
      description: "Получатели email-оповещений по организации и подразделениям",
      icon: Bell,
      isActive: (pathname, orgBase) => pathname.startsWith(`${orgBase}/contacts`),
    },
  ]
}

export function OrgNav({ organizationId }: { organizationId: number }) {
  const pathname = usePathname()
  const base = `/panel/organizations/${organizationId}`
  const items = orgNavItems(organizationId)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active = item.isActive(pathname, base)
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
    </div>
  )
}
