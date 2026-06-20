"use client"

import {
  usePublicBreadcrumbLabel,
  usePublicBreadcrumbMiddle,
} from "@/components/public/public-breadcrumb"

export function PublicBreadcrumbLabel({ label }: { label: string }) {
  usePublicBreadcrumbLabel(label)
  return null
}

export function PublicBreadcrumbMiddle({
  crumbs,
}: {
  crumbs: { label: string; href: string }[]
}) {
  usePublicBreadcrumbMiddle(crumbs)
  return null
}
