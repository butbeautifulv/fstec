"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useServerInsertedHTML } from "next/navigation"
import { ThemeHotkey } from "@/components/theme-hotkey"
import {
  THEME_BLOCKING_SCRIPT,
  THEME_STORAGE_KEY,
} from "@/lib/theme/blocking-script"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme | undefined
  resolvedTheme: ResolvedTheme | undefined
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  return theme
}

function applyThemeToDocument(theme: Theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  return resolved
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const inserted = useRef(false)

  useServerInsertedHTML(() => {
    if (inserted.current) return null
    inserted.current = true
    return (
      <script
        dangerouslySetInnerHTML={{ __html: THEME_BLOCKING_SCRIPT }}
        suppressHydrationWarning
      />
    )
  })

  const [theme, setThemeState] = useState<Theme | undefined>(undefined)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(
    undefined
  )

  useEffect(() => {
    const stored =
      (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system"
    setThemeState(stored)
    setResolvedTheme(applyThemeToDocument(stored))
  }, [])

  useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function onChange() {
      setResolvedTheme(applyThemeToDocument("system"))
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setThemeState(next)
    setResolvedTheme(applyThemeToDocument(next))
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}

export { ThemeProvider, useTheme }
