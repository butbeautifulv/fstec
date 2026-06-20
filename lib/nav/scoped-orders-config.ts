import { format } from "date-fns"
import { labels } from "@/lib/ui/branding"

export function formatOrderIssuedDescription(issuedAt: string): string {
  return `Выдано ${format(new Date(issuedAt), "dd.MM.yyyy")}`
}

export type ScopedOrdersContext =
  | { scope: "public"; token: string }
  | { scope: "report"; token: string; organizationName: string }

export function scopedOrdersBasePath(context: ScopedOrdersContext): string {
  return context.scope === "public"
    ? `/p/${context.token}`
    : `/report/${context.token}`
}

export function scopedOrdersListConfig(context: ScopedOrdersContext) {
  const basePath = scopedOrdersBasePath(context)

  if (context.scope === "public") {
    return {
      basePath,
      title: "Поручения",
      description: "Список поручений по исполнению мер",
      backHref: basePath,
      backLabel: "Сводка",
      searchPlaceholder: undefined as string | undefined,
    }
  }

  return {
    basePath,
    title: context.organizationName,
    description: "Поручения организации",
    backHref: basePath,
    backLabel: "Назад к сводке",
    searchPlaceholder: "Поиск по поручению…",
  }
}

export function scopedOrderDetailConfig(
  context: ScopedOrdersContext,
  order: { title: string; issuedAt: string },
  organizationName?: string
) {
  const basePath = scopedOrdersBasePath(context)

  if (context.scope === "public") {
    return {
      basePath,
      title: order.title,
      description: formatOrderIssuedDescription(order.issuedAt),
      backHref: `${basePath}/orders`,
      backLabel: "Поручения",
      actionLabel: "Заполнить" as string | undefined,
    }
  }

  const orgLabel = organizationName ?? context.organizationName
  return {
    basePath,
    title: order.title,
    description: `${labels.org}: ${orgLabel} · выдано ${format(new Date(order.issuedAt), "dd.MM.yyyy")}`,
    backHref: basePath,
    backLabel: "Назад к сводке",
    actionLabel: undefined as string | undefined,
  }
}

export function scopedOrderDetailMiddleCrumbs(
  context: ScopedOrdersContext,
  order: { id: number; title: string }
) {
  if (context.scope !== "public") return null

  const basePath = scopedOrdersBasePath(context)
  return [
    { label: "Сводка", href: basePath },
    { label: "Поручения", href: `${basePath}/orders` },
    { label: order.title, href: `${basePath}/orders/${order.id}` },
  ]
}
