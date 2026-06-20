"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { DEFAULT_LOCALE, isLocaleId, type LocaleId } from "@/lib/i18n/locales"

type LocaleContextValue = {
  locale: LocaleId
  refreshLocale: () => void
  loading: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const [locale, setLocale] = useState<LocaleId>(DEFAULT_LOCALE)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refreshLocale = useCallback(() => {
    setTick((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    const url = isAdmin ? "/api/auth/me" : "/api/settings"
    void fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { effectiveLocale?: string; locale?: string } | null) => {
        if (cancelled || !data) return
        const next =
          (isAdmin ? data.effectiveLocale : data.locale) ??
          data.locale ??
          DEFAULT_LOCALE
        if (isLocaleId(next)) setLocale(next)
      })
      .catch(() => {
        if (!cancelled) setLocale(DEFAULT_LOCALE)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAdmin, pathname, tick])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({ locale, refreshLocale, loading }),
    [locale, refreshLocale, loading]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}
