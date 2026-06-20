"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { PageHeader } from "@/components/shared/page-header"
import { OverflowText } from "@/components/shared/overflow-text"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { colMeta, actionsColumnMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { TextCell } from "@/lib/data-table/text-cell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResourceDelete } from "@/hooks/use-resource-delete"
import { labels } from "@/lib/ui/branding"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"

type Org = {
  id: number
  name: string
  shortCode: string | null
  subdivisions: { id: number; name: string }[]
}

function SubdivisionsCell({ subdivisions }: { subdivisions: Org["subdivisions"] }) {
  if (subdivisions.length === 0) return <>—</>

  const fullLabel = subdivisions.map((s) => s.name).join(", ")

  if (subdivisions.length >= 3) {
    return (
      <OverflowText title={fullLabel}>
        {`${subdivisions.length} подразделений`}
      </OverflowText>
    )
  }

  return <OverflowText>{fullLabel}</OverflowText>
}

export function OrganizationsManager({
  initialOrgs,
  headOrganizationId,
}: {
  initialOrgs: Org[]
  headOrganizationId: number | null
}) {
  const [orgs, setOrgs] = useState(initialOrgs)
  const { deleteId, deleting, requestDelete, confirmDelete, cancelDelete } =
    useResourceDelete({
      url: (id) => `/api/organizations?id=${id}`,
      onRemoved: (id) => setOrgs((prev) => prev.filter((o) => o.id !== id)),
      successMessage: `${labels.org} удалена`,
      errorMessage: `Не удалось удалить ${labels.org.toLowerCase()}`,
    })

  const columns = useMemo<ColumnDef<Org>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.org} />
        ),
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-2">
            <TextCell
              text={row.original.name}
              href={`/panel/organizations/${row.original.id}`}
              className="min-w-0 flex-1"
            />
            {row.original.id === headOrganizationId && (
              <Badge variant="secondary" className="shrink-0">
                Головная
              </Badge>
            )}
          </span>
        ),
        meta: textColumnMeta(labels.org, "w-[28%]"),
      },
      {
        accessorKey: "shortCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Код" />
        ),
        cell: ({ row }) => row.original.shortCode ?? "—",
        meta: colMeta("Код", { cellClassName: "w-24" }),
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
        cell: ({ row }) => (
          <SubdivisionsCell subdivisions={row.original.subdivisions} />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Подразделения", { cellClassName: "max-w-0 w-[30%]" }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        meta: actionsColumnMeta(),
        cell: ({ row }) => (
          <TableRowActions
            actions={[
              {
                label: "Открыть",
                icon: <ExternalLink data-icon="inline-start" />,
                href: `/panel/organizations/${row.original.id}`,
              },
              {
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                href: `/panel/organizations/${row.original.id}/edit`,
              },
              {
                label: "Удалить",
                icon: <Trash2 data-icon="inline-start" />,
                destructive: true,
                onClick: () => requestDelete(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    [headOrganizationId]
  )

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={labels.orgs}
        description={`Управление ${labels.orgPluralGenitive} и подразделениями`}
        actions={
          <Button asChild>
            <Link href="/panel/organizations/new">
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
              <Link href="/panel/organizations/new">
                <Plus data-icon="inline-start" />
                Добавить {labels.org.toLowerCase()}
              </Link>
            </Button>
          </EmptyTableState>
        }
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && cancelDelete()}
        title={`Удалить ${labels.org.toLowerCase()}?`}
        description={`${labels.org} и все подразделения будут удалены. Это возможно только если нет связанных поручений.`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
