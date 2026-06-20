"use client"

import type { LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OverflowText } from "@/components/shared/overflow-text"
import { ShellBrand } from "@/components/shell/shell-brand"
import { ShellNavMain, type ShellNavMainItem } from "@/components/shell/shell-nav-main"
import Link from "next/link"

export type ShellSidebarLink = {
  href: string
  label: string
  icon: LucideIcon
}

export function ShellSidebar({
  brand,
  navItems,
  navContent,
  groupLabel,
  footer,
  primaryAction,
  secondaryLinks,
  variant = "inset",
}: {
  brand: {
    href: string
    title: string
    subtitle?: string
    subtitleTitle?: string
    icon: LucideIcon
    logo?: React.ReactNode
  }
  navItems?: ShellNavMainItem[]
  navContent?: React.ReactNode
  groupLabel: string
  footer?: React.ReactNode
  primaryAction?: { href: string; label: string; icon: LucideIcon }
  secondaryLinks?: ShellSidebarLink[]
  variant?: "sidebar" | "floating" | "inset"
}) {
  const PrimaryIcon = primaryAction?.icon

  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader>
        <ShellBrand
          href={brand.href}
          title={brand.title}
          subtitle={brand.subtitle}
          subtitleTitle={brand.subtitleTitle}
          icon={brand.icon}
          logo={brand.logo}
        />
      </SidebarHeader>
      {primaryAction && PrimaryIcon && (
        <div className="shrink-0 px-2 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                <Link href={primaryAction.href}>
                  <PrimaryIcon />
                  <OverflowText className="min-w-0 flex-1">{primaryAction.label}</OverflowText>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      )}
      <SidebarContent className="flex min-h-0 flex-col overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pb-2">
            {navContent ?? <ShellNavMain groupLabel={groupLabel} items={navItems ?? []} />}
            {secondaryLinks && secondaryLinks.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Дополнительно</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {secondaryLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <SidebarMenuItem key={link.href}>
                          <SidebarMenuButton asChild tooltip={link.label}>
                <Link href={link.href} className="min-w-0">
                              <Icon />
                              <OverflowText className="min-w-0 flex-1">{link.label}</OverflowText>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
      <SidebarRail />
    </Sidebar>
  )
}
