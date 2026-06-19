"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Measure = { id: number; name: string; code: string | null }

export function MeasurePicker({
  measures,
  selected,
  onChange,
}: {
  measures: Measure[]
  selected: Set<number>
  onChange: (next: Set<number>) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return measures
    return measures.filter((m) =>
      [m.name, m.code ?? ""].join(" ").toLowerCase().includes(q)
    )
  }, [measures, search])

  function toggle(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(filtered.map((m) => m.id)))
  }

  function clearAll() {
    const next = new Set(selected)
    for (const m of filtered) next.delete(m.id)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Поиск по названию или коду…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={selectAll}>
          Выбрать все
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          Снять все
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          Выбрано: {selected.size}
        </span>
      </div>
      <ScrollArea className="max-h-72 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Название</TableHead>
              <TableHead className="w-24">Код</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                  Меры не найдены
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => toggle(m.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(m.id)}
                      onCheckedChange={() => toggle(m.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.code ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
