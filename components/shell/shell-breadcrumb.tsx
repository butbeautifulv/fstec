"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type ShellCrumb = { label: string; href?: string }

const ShellBreadcrumbContext = createContext<{
  dynamicLabel: string | null
  setDynamicLabel: (label: string | null) => void
} | null>(null)

export function ShellBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [dynamicLabel, setDynamicLabel] = useState<string | null>(null)
  const value = useMemo(
    () => ({ dynamicLabel, setDynamicLabel }),
    [dynamicLabel]
  )
  return (
    <ShellBreadcrumbContext.Provider value={value}>
      {children}
    </ShellBreadcrumbContext.Provider>
  )
}

export function useShellBreadcrumbLabel(label: string | null) {
  const ctx = useContext(ShellBreadcrumbContext)
  const setDynamicLabel = ctx?.setDynamicLabel

  useEffect(() => {
    if (!setDynamicLabel) return
    setDynamicLabel(label)
    return () => setDynamicLabel(null)
  }, [label, setDynamicLabel])
}

export function ShellBreadcrumb({
  buildCrumbs,
}: {
  buildCrumbs: (pathname: string, dynamicLabel: string | null) => ShellCrumb[]
}) {
  const pathname = usePathname()
  const ctx = useContext(ShellBreadcrumbContext)
  const crumbs = buildCrumbs(pathname, ctx?.dynamicLabel ?? null)

  const items: ReactNode[] = []
  crumbs.forEach((crumb, index) => {
    if (index > 0) {
      items.push(
        <BreadcrumbSeparator key={`sep-${index}`} className="hidden md:block" />
      )
    }
    const isLast = index === crumbs.length - 1
    items.push(
      <BreadcrumbItem
        key={`${crumb.label}-${index}`}
        className={index === 0 ? "hidden md:block" : undefined}
      >
        {isLast || !crumb.href ? (
          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={crumb.href}>{crumb.label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    )
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>{items}</BreadcrumbList>
    </Breadcrumb>
  )
}
