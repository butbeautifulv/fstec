"use client"

import Link from "next/link"
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
import { ShellNavGroups, type ShellNavOrder } from "@/components/shell/shell-nav-groups"

export type ShellSidebarLink = {
  href: string
  label: string
  icon: LucideIcon
}

export function ShellSidebar({
  brand,
  links,
  pathname,
  isLinkActive,
  footer,
  primaryAction,
  secondaryLinks,
  navOrders,
  variant = "inset",
}: {
  brand: { href: string; title: string; subtitle?: string; icon: LucideIcon }
  links: ShellSidebarLink[]
  pathname: string
  isLinkActive: (link: ShellSidebarLink, pathname: string) => boolean
  footer?: React.ReactNode
  primaryAction?: { href: string; label: string; icon: LucideIcon }
  secondaryLinks?: ShellSidebarLink[]
  navOrders?: ShellNavOrder[]
  variant?: "sidebar" | "floating" | "inset"
}) {
  const BrandIcon = brand.icon
  const PrimaryIcon = primaryAction?.icon

  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={brand.href} className="min-w-0">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BrandIcon />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium" title={brand.title}>
                    {brand.title}
                  </span>
                  {brand.subtitle && (
                    <span className="truncate text-xs" title={brand.subtitle}>
                      {brand.subtitle}
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            {primaryAction && PrimaryIcon && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  >
                    <Link href={primaryAction.href}>
                      <PrimaryIcon />
                      <span>{primaryAction.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
            <SidebarMenu>
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive(link, pathname)}
                      tooltip={link.label}
                    >
                      <Link href={link.href}>
                        <Icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navOrders && <ShellNavGroups orders={navOrders} />}
        {secondaryLinks && secondaryLinks.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Дополнительно</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton asChild tooltip={link.label}>
                        <Link href={link.href}>
                          <Icon />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
      <SidebarRail />
    </Sidebar>
  )
}
