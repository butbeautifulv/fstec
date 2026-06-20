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
}: {
  token: string
  navOrders: PublicNavOrder[]
}) {
  const pathname = usePathname()
  const navItems = useMemo(
    () => buildPublicNavMainItems(token, navOrders, pathname),
    [token, navOrders, pathname]
  )

  return <ShellNavMain groupLabel="Навигация" items={navItems} />
}
