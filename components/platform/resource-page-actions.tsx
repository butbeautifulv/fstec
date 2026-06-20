"use client"

import Link from "next/link"
import { Permission } from "@/lib/auth/permissions"
import { usePlatformUser } from "@/components/platform/use-platform-user"
import { Button } from "@/components/ui/button"

export function MeasuresPageActions() {
  const { can } = usePlatformUser()
  if (!can(Permission.measuresWrite)) return null

  return (
    <Button asChild>
      <Link href="/panel/measures/new">Добавить меру</Link>
    </Button>
  )
}

export function OrdersPageActions() {
  const { can } = usePlatformUser()
  if (!can(Permission.ordersWrite)) return null

  return (
    <Button asChild>
      <Link href="/panel/orders/new">Создать поручение</Link>
    </Button>
  )
}
