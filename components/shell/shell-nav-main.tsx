"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ChevronRightIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type ShellNavMainChild = {
  title: string
  href: string
  badge?: React.ReactNode
  isActive?: boolean
}

export type ShellNavMainItem = {
  title: string
  href?: string
  icon?: LucideIcon
  isActive?: boolean
  defaultOpen?: boolean
  badge?: React.ReactNode
  children?: ShellNavMainChild[]
}

function NavMainItem({ item }: { item: ShellNavMainItem }) {
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren && item.href) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
          <Link href={item.href}>
            {Icon && <Icon />}
            <span className="truncate">{item.title}</span>
            {item.badge}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  if (!hasChildren) return null

  return (
    <Collapsible
      asChild
      defaultOpen={item.defaultOpen ?? item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {Icon && <Icon />}
            <span className="truncate">{item.title}</span>
            {item.badge}
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={child.isActive}>
                  <Link href={child.href} className="min-w-0">
                    <span className="truncate">{child.title}</span>
                    {child.badge}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function ShellNavMain({
  groupLabel,
  items,
  primaryAction,
}: {
  groupLabel: string
  items: ShellNavMainItem[]
  primaryAction?: { href: string; label: string; icon: LucideIcon }
}) {
  const PrimaryIcon = primaryAction?.icon

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
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
          {items.map((item) => (
            <NavMainItem key={item.href ?? item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
