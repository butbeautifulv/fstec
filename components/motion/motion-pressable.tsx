"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { pressable } from "@/components/motion/motion-presets"
import { cn } from "@/lib/utils"

export function MotionPressable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <span className={cn("inline-flex", className)}>{children}</span>
  }

  return (
    <motion.span className={cn("inline-flex", className)} {...pressable}>
      {children}
    </motion.span>
  )
}
