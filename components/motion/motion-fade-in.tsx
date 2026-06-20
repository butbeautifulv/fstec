"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from "@/components/motion/motion-presets"
import { cn } from "@/lib/utils"

export function MotionFadeIn({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode
  className?: string
  delay?: number
  variant?: "up" | "fade"
}) {
  const reduceMotion = useReducedMotion()
  const preset = variant === "fade" ? fadeIn : fadeInUp

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={preset.initial}
      animate={preset.animate}
      transition={{ ...preset.transition, delay }}
    >
      {children}
    </motion.div>
  )
}

export function MotionPageEnter({
  children,
  className,
  pageKey,
}: {
  children: ReactNode
  className?: string
  pageKey: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      key={pageKey}
      className={className}
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={fadeInUp.transition}
    >
      {children}
    </motion.div>
  )
}

export function MotionStagger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={cn(className)} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
