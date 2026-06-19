"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

export type ShellNavOrder = {
  title: string
  items: {
    id: number
    measureName: string
    displayStatus: string
    isOverdue: boolean
    href: string
  }[]
}

export function ShellNavGroups({ orders }: { orders: ShellNavOrder[] }) {
  const pathname = usePathname()

  if (orders.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Поручения</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {orders.map((order) => (
            <Collapsible key={order.title} defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={order.title}>
                    <ChevronRightIcon className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    <span className="truncate">{order.title}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {order.items.map((item) => (
                      <SidebarMenuSubItem key={item.id}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                          <Link href={item.href}>
                            <span className="truncate">{item.measureName}</span>
                            <Badge
                              variant={item.isOverdue ? "destructive" : "secondary"}
                              className="ml-auto shrink-0 text-[10px]"
                            >
                              {item.displayStatus}
                            </Badge>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
