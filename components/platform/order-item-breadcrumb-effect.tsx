"use client"

import {
  usePlatformBreadcrumbLabel,
  usePlatformBreadcrumbMiddle,
} from "@/components/platform/platform-breadcrumb"

export function OrderItemBreadcrumbEffect({
  orderId,
  orderTitle,
  measureName,
  pageLabel,
}: {
  orderId: number
  orderTitle: string
  measureName: string
  pageLabel: string
}) {
  usePlatformBreadcrumbMiddle([
    { label: orderTitle, href: `/panel/orders/${orderId}` },
    { label: measureName },
  ])
  usePlatformBreadcrumbLabel(pageLabel)
  return null
}
