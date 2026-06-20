"use client"

import type { Table } from "@tanstack/react-table"
import { Columns3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DataTableColumnToggle<TData>({ table }: { table: Table<TData> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3Icon data-icon="inline-start" />
          Колонки
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {typeof column.columnDef.header === "string"
                ? column.columnDef.header
                : (column.columnDef.meta?.title ?? column.id)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
