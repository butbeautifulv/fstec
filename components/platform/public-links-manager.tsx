"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { ShareLinkField } from "@/components/shared/share-link-field"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import type { LinkScopeRow } from "@/lib/public-links/types"
import { notify } from "@/lib/ui/feedback"
import { RefreshCw } from "lucide-react"

const KIND_LABELS: Record<LinkScopeRow["kind"], string> = {
  report: "Отчёт",
  organization: "Организация",
  subdivision: "Подразделение",
}

export function PublicLinksManager({ initialScopes }: { initialScopes: LinkScopeRow[] }) {
  const [scopes, setScopes] = useState(initialScopes)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAllActive, setConfirmAllActive] = useState(false)

  const refreshScopes = useCallback(async () => {
    const res = await fetch("/api/settings/public-links")
    if (!res.ok) {
      notify.error("Не удалось обновить список ссылок")
      return
    }
    const data = (await res.json()) as { scopes: LinkScopeRow[] }
    setScopes(data.scopes)
    setSelectedKeys(new Set())
  }, [])

  useEffect(() => {
    setScopes(initialScopes)
  }, [initialScopes])

  async function regenerate(keys?: string[], allActive = false) {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/public-links/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allActive ? { allActive: true } : { keys }),
      })
      if (!res.ok) {
        notify.error("Не удалось регенерировать ссылки")
        return
      }
      const data = (await res.json()) as { regenerated: { key: string }[] }
      notify.success(`Обновлено ссылок: ${data.regenerated.length}`)
      await refreshScopes()
    } finally {
      setLoading(false)
      setConfirmOpen(false)
      setConfirmAllActive(false)
    }
  }

  const selectableKeys = useMemo(
    () => scopes.map((scope) => scope.key),
    [scopes]
  )

  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every((key) => selectedKeys.has(key))

  const columns = useMemo<ColumnDef<LinkScopeRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              setSelectedKeys(checked ? new Set(selectableKeys) : new Set())
            }}
            aria-label="Выбрать все"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedKeys.has(row.original.key)}
            onCheckedChange={(checked) => {
              setSelectedKeys((prev) => {
                const next = new Set(prev)
                if (checked) next.add(row.original.key)
                else next.delete(row.original.key)
                return next
              })
            }}
            aria-label={`Выбрать ${row.original.key}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "kind",
        accessorFn: (row) => KIND_LABELS[row.kind],
        header: "Тип",
        cell: ({ row }) => KIND_LABELS[row.original.kind],
      },
      {
        id: "organizationName",
        accessorFn: (row) => row.organizationName ?? "—",
        header: "Организация",
      },
      {
        id: "subdivisionName",
        accessorFn: (row) => row.subdivisionName ?? "—",
        header: "Подразделение",
      },
      {
        id: "status",
        accessorFn: (row) => row.status,
        header: "Portal",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "secondary" : "outline"}>
            {row.original.status === "active" ? "Активна" : "Нет ссылки"}
          </Badge>
        ),
      },
      {
        id: "path",
        accessorFn: (row) => row.activeLink?.path ?? "—",
        header: "Portal (/p/)",
        cell: ({ row }) => {
          const path = row.original.activeLink?.path
          if (!path) return "—"
          return <ShareLinkField path={path} className="min-w-[22rem]" />
        },
      },
      {
        id: "reportPath",
        accessorFn: (row) => row.reportPath ?? "—",
        header: "Отчёт (/report/)",
        cell: ({ row }) => {
          const path = row.original.reportPath
          if (!path) return "—"
          return (
            <ShareLinkField
              path={path}
              className="min-w-[22rem]"
              copySuccessMessage="Ссылка на отчёт скопирована"
            />
          )
        },
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.activeLink?.createdAt ?? "",
        header: "Создана",
        cell: ({ row }) => {
          const createdAt = row.original.activeLink?.createdAt
          if (!createdAt) return "—"
          return new Date(createdAt).toLocaleString("ru-RU")
        },
      },
    ],
    [allSelected, selectableKeys, selectedKeys]
  )

  const selectedCount = selectedKeys.size
  const activeCount = scopes.filter((scope) => scope.status === "active").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Публичные ссылки"
        description="Portal-ссылки (/p/…) и отчётные ссылки (/report/…) — отдельный токен на каждый срез. Регенерация отзывает старые URL."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void refreshScopes()}
            >
              {loading ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
              Обновить
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || selectedCount === 0}
              onClick={() => {
                setConfirmAllActive(false)
                setConfirmOpen(true)
              }}
            >
              Регенерировать выбранные ({selectedCount})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loading || activeCount === 0}
              onClick={() => {
                setConfirmAllActive(true)
                setConfirmOpen(true)
              }}
            >
              Регенерировать все активные ({activeCount})
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={scopes}
        pageSize={25}
        showColumnToggle={false}
        searchPlaceholder="Поиск по организации, подразделению…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [
            KIND_LABELS[row.kind],
            row.organizationName ?? "",
            row.subdivisionName ?? "",
            row.activeLink?.path ?? "",
            row.reportPath ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        empty={
          <p className="py-8 text-center text-sm text-muted-foreground">
            Нет областей для управления ссылками
          </p>
        }
      />

      <ConfirmDeleteAlert
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAllActive ? "Регенерировать все активные ссылки?" : "Регенерировать выбранные ссылки?"}
        description={
          confirmAllActive
            ? `Будут перевыпущены ${activeCount} активных ссылок. Старые URL из писем и закладок перестанут работать.`
            : `Будут перевыпущены ${selectedCount} выбранных ссылок. Старые URL перестанут работать.`
        }
        loading={loading}
        onConfirm={() =>
          void regenerate(confirmAllActive ? undefined : [...selectedKeys], confirmAllActive)
        }
      />
    </div>
  )
}
