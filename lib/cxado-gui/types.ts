import type { LucideIcon } from "lucide-react"

export type ComplianceStatCardMeta = {
  hint: string
  icon: LucideIcon
  badge?: (value: number, total: number) => string | null
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
}

/** Mirrors @cxado/gui CompliancePresentationConfig for FSTEC adapter typing. */
export type CompliancePresentationConfig = {
  statusOrder: readonly string[]
  overdueStackOrder: readonly string[]
  statCardMeta: Record<string, ComplianceStatCardMeta>
  chartEmptyLabel: string
  pieColors: readonly string[]
}
