import { APP_SIDEBAR_NAME } from "@/lib/ui/branding"

export function formatPublicBrandTitle() {
  return APP_SIDEBAR_NAME
}

export function formatPublicBrandSubtitle(
  orgName: string,
  subdivision?: string | null
) {
  if (subdivision) return `${orgName} · ${subdivision}`
  return orgName
}

export function formatPublicBrandTooltip(
  orgName: string,
  subdivision?: string | null
) {
  if (subdivision) return `${orgName} · ${subdivision}`
  return orgName
}
