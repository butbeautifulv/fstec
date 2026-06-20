"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function ChartsLazyBoundary({
  children,
  fallback,
  rootMargin = "200px",
}: {
  children: ReactNode
  fallback: ReactNode
  rootMargin?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return <div ref={ref}>{inView ? children : fallback}</div>
}
