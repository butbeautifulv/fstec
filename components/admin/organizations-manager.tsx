"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/admin/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/admin/crud/empty-table-state"
import { TableRowActions } from "@/components/admin/crud/table-row-actions"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { facetedFilter, FACETED_COLUMN_META } from "@/lib/data-table/faceted-column"
import { Button } from "@/components/ui/button"
import { labels } from "@/lib/ui/branding"
import { notify } from "@/lib/ui/feedback"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"

type Org = {
  id: number
  name: string
  shortCode: string | null
  subdivisions: { id: number; name: string }[]
}

export function OrganizationsManager({ initialOrgs }: { initialOrgs: Org[] }) {
  const router = useRouter()
  const [orgs, setOrgs] = useState(initialOrgs)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/organizations?id=${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setOrgs((prev) => prev.filter((o) => o.id !== deleteId))
      setDeleteId(null)
      router.refresh()
      notify.success(`${labels.org} удалена`)
    } else {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? `Не удалось удалить ${labels.org.toLowerCase()}`)
    }
  }

  const columns = useMemo<ColumnDef<Org>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/organizations/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "shortCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        cell: ({ row }) => row.original.shortCode ?? "—",
      },
      {
        id: "subdivisions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Подразделения" />
        ),
        accessorFn: (row) =>
          row.subdivisions.length
            ? row.subdivisions.map((s) => s.name).join(", ")
            : "—",
        cell: ({ row }) =>
          row.original.subdivisions.length
            ? row.original.subdivisions.map((s) => s.name).join(", ")
            : "—",
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: { ...FACETED_COLUMN_META, title: "Подразделения" },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <TableRowActions
            actions={[
              {
                label: "Открыть",
                icon: <ExternalLink data-icon="inline-start" />,
                href: `/admin/organizations/${row.original.id}`,
              },
              {
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                href: `/admin/organizations/${row.original.id}/edit`,
              },
              {
                label: "Удалить",
                icon: <Trash2 data-icon="inline-start" />,
                destructive: true,
                onClick: () => setDeleteId(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={labels.orgs}
        description={`Управление ${labels.orgPluralGenitive} и подразделениями`}
        actions={
          <Button asChild>
            <Link href="/admin/organizations/new">
              <Plus data-icon="inline-start" />
              Добавить {labels.org.toLowerCase()}
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={orgs}
        searchPlaceholder={`Поиск по ${labels.org.toLowerCase()}, коду, подразделению…`}
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [
            row.name,
            row.shortCode ?? "",
            row.subdivisions.map((s) => s.name).join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        empty={
          <EmptyTableState
            title={`Нет ${labels.orgPluralGenitive}`}
            description={`Добавьте первую ${labels.org.toLowerCase()}`}
          >
            <Button size="sm" asChild>
              <Link href="/admin/organizations/new">
                <Plus data-icon="inline-start" />
                Добавить {labels.org.toLowerCase()}
              </Link>
            </Button>
          </EmptyTableState>
        }
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={`Удалить ${labels.org.toLowerCase()}?`}
        description={`${labels.org} и все подразделения будут удалены. Это возможно только если нет связанных поручений.`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
