export const DEFAULT_TIMEZONE = "Europe/Moscow"

export type TimezoneOption = {
  id: string
  label: string
}

function formatUtcOffset(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date())
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC"
  return offset.replace("GMT", "UTC")
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: "Europe/Kaliningrad", label: "Калининград" },
  { id: "Europe/Moscow", label: "Москва" },
  { id: "Europe/Samara", label: "Самара" },
  { id: "Asia/Yekaterinburg", label: "Екатеринбург" },
  { id: "Asia/Omsk", label: "Омск" },
  { id: "Asia/Krasnoyarsk", label: "Красноярск" },
  { id: "Asia/Irkutsk", label: "Иркутск" },
  { id: "Asia/Yakutsk", label: "Якутск" },
  { id: "Asia/Vladivostok", label: "Владивосток" },
  { id: "Asia/Magadan", label: "Магадан" },
  { id: "Asia/Kamchatka", label: "Камчатка" },
].map((zone) => ({
  ...zone,
  label: `${zone.label} (${formatUtcOffset(zone.id)})`,
}))

export function getTimezoneLabel(timeZone: string): string {
  return TIMEZONE_OPTIONS.find((z) => z.id === timeZone)?.label ?? timeZone
}
