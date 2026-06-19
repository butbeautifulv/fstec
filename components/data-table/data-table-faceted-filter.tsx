"use client"

import type { Column } from "@tanstack/react-table"
import { CheckIcon, ListFilterIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type DataTableFacetedFilterProps<TData, TValue> = {
  column: Column<TData, TValue>
  title?: string
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column.getFacetedUniqueValues()
  const selectedValues = new Set((column.getFilterValue() as string[]) ?? [])

  const options = Array.from(facets.keys())
    .map((value) => ({
      label: value === "" || value == null ? "—" : String(value),
      value: value === "" || value == null ? "—" : String(value),
      count: facets.get(value) ?? 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-7 shrink-0">
          <ListFilterIcon className="size-3.5" />
          {selectedValues.size > 0 && (
            <Badge
              variant="secondary"
              className="pointer-events-none absolute -top-1 -right-1 size-4 rounded-full p-0 text-[10px]"
            >
              {selectedValues.size}
            </Badge>
          )}
          <span className="sr-only">Фильтр {title ?? column.id}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={title ?? column.id} />
          <CommandList>
            <CommandEmpty>Нет значений</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const next = new Set(selectedValues)
                      if (isSelected) next.delete(option.value)
                      else next.add(option.value)
                      column.setFilterValue(next.size ? Array.from(next) : undefined)
                    }}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <span className="flex-1 truncate">{option.label}</span>
                    <span className="text-muted-foreground tabular-nums">{option.count}</span>
                    <CheckIcon
                      className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {options.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() =>
                    column.setFilterValue(options.map((option) => option.value))
                  }
                >
                  Выбрать все
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={() => column.setFilterValue(undefined)}
                >
                  Сбросить
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
