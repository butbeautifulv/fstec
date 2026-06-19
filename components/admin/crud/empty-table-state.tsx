import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

type EmptyTableStateProps = {
  title: string
  description?: string
  children?: React.ReactNode
}

export function EmptyTableState({ title, description, children }: EmptyTableStateProps) {
  return (
    <Empty className="border-0 py-12">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}
