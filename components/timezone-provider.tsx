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
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS } from "@/lib/datetime/timezones"
import { setFilterTimeZone } from "@/lib/datetime/filter-timezone"

type TimezoneContextValue = {
  timeZone: string
  setTimeZone: (timeZone: string) => void
  loading: boolean
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null)

function isValidTimezone(value: string) {
  return TIMEZONE_OPTIONS.some((z) => z.id === value)
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timeZone, setTimeZoneState] = useState(DEFAULT_TIMEZONE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { timezone?: string }) => {
        if (cancelled) return
        const tz = data.timezone && isValidTimezone(data.timezone) ? data.timezone : DEFAULT_TIMEZONE
        setTimeZoneState(tz)
        setFilterTimeZone(tz)
      })
      .catch(() => {
        if (!cancelled) {
          setTimeZoneState(DEFAULT_TIMEZONE)
          setFilterTimeZone(DEFAULT_TIMEZONE)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setTimeZone = useCallback((next: string) => {
    if (isValidTimezone(next)) {
      setTimeZoneState(next)
      setFilterTimeZone(next)
    }
  }, [])

  const value = useMemo(
    () => ({ timeZone, setTimeZone, loading }),
    [timeZone, setTimeZone, loading]
  )

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext)
  if (!ctx) {
    throw new Error("useTimezone must be used within TimezoneProvider")
  }
  return ctx
}
