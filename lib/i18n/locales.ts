export const SUPPORTED_LOCALES = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const

export type LocaleId = (typeof SUPPORTED_LOCALES)[number]["id"]

export const DEFAULT_LOCALE: LocaleId = "ru"

export const LOCALE_IDS = SUPPORTED_LOCALES.map((l) => l.id) as [LocaleId, ...LocaleId[]]

export function isLocaleId(value: string | null | undefined): value is LocaleId {
  return LOCALE_IDS.includes(value as LocaleId)
}

export function resolveLocale(
  userLocale: string | null | undefined,
  globalLocale: string | null | undefined
): LocaleId {
  if (userLocale && isLocaleId(userLocale)) return userLocale
  if (globalLocale && isLocaleId(globalLocale)) return globalLocale
  return DEFAULT_LOCALE
}

export function localeLabel(id: LocaleId): string {
  return SUPPORTED_LOCALES.find((l) => l.id === id)?.label ?? id
}
