import { DEFAULT_TIMEZONE } from "@/lib/datetime/timezones"

let filterTimeZone = DEFAULT_TIMEZONE

export function getFilterTimeZone() {
  return filterTimeZone
}

export function setFilterTimeZone(timeZone: string) {
  filterTimeZone = timeZone
}
