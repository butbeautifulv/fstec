"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { ShellNavMain } from "@/components/shell/shell-nav-main"
import { buildPublicNavMainItems } from "@/lib/public/build-public-nav-main"

type PublicNavOrder = {
  items: { id: number }[]
}

export function PublicNavMain({
  token,
  navOrders,
  revisionCount = 0,
}: {
  token: string
  navOrders: PublicNavOrder[]
  revisionCount?: number
}) {
  const pathname = usePathname()
  const navItems = useMemo(
    () => buildPublicNavMainItems(token, navOrders, pathname, revisionCount),
    [token, navOrders, pathname, revisionCount]
  )

  return <ShellNavMain groupLabel="Навигация" items={navItems} />
}
