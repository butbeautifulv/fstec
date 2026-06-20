"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import type { UserRole } from "@prisma/client"
import type { ColumnDef } from "@tanstack/react-table"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { PageHeader } from "@/components/shared/page-header"
import { usePlatformUser } from "@/components/platform/use-platform-user"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { colMeta, actionsColumnMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { ROLE_LABELS } from "@/lib/auth/permissions"
import { TextCell } from "@/lib/data-table/text-cell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notify } from "@/lib/ui/feedback"
import { format } from "date-fns"
import { Pencil, Plus, Trash2 } from "lucide-react"

type UserRow = {
  id: number
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export function UsersListClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter()
  const { me } = usePlatformUser()
  const [users, setUsers] = useState(initialUsers)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)

  const closeDeleteDialog = useCallback(() => {
    setDeleteId(null)
    setDeletePassword("")
  }, [])

  const confirmDelete = useCallback(async () => {
    if (deleteId == null) return
    setDeleting(true)
    const res = await fetch(`/api/users/${deleteId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    })
    setDeleting(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Ошибка удаления")
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteId))
    closeDeleteDialog()
    notify.success("Пользователь удалён")
    router.refresh()
  }, [deleteId, deletePassword, closeDeleteDialog, router])

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.email}
            href={`/panel/settings/users/${row.original.id}/edit`}
          />
        ),
        meta: textColumnMeta("Email", "w-[28%]"),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Имя" />
        ),
        cell: ({ row }) => <TextCell text={row.original.name} />,
        meta: textColumnMeta("Имя", "w-[20%]"),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Роль" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{ROLE_LABELS[row.original.role]}</Badge>
        ),
        meta: colMeta("Роль", { cellClassName: "w-32" }),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Добавлен" />
        ),
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd.MM.yyyy"),
        meta: colMeta("Добавлен", { valueType: "date", cellClassName: "w-28" }),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        meta: actionsColumnMeta(),
        cell: ({ row }) => {
          const isSelf = me?.id === row.original.id
          const actions = [
            {
              label: "Изменить",
              icon: <Pencil data-icon="inline-start" />,
              href: `/panel/settings/users/${row.original.id}/edit`,
            },
            ...(isSelf
              ? []
              : [
                  {
                    label: "Удалить",
                    icon: <Trash2 data-icon="inline-start" />,
                    destructive: true,
                    onClick: () => setDeleteId(row.original.id),
                  },
                ]),
          ]
          return <TableRowActions actions={actions} />
        },
      },
    ],
    [me?.id]
  )

  const deleteTarget = deleteId != null ? users.find((u) => u.id === deleteId) : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Пользователи"
        description="Учётные записи админ-панели"
        backHref="/panel/settings"
        backLabel="Настройки"
        actions={
          <Button asChild>
            <Link href="/panel/settings/users/new">
              <Plus data-icon="inline-start" />
              Добавить пользователя
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Поиск по email или имени…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          return [row.email, row.name, ROLE_LABELS[row.role]].join(" ").toLowerCase().includes(q)
        }}
        empty={
          <EmptyTableState title="Нет пользователей" description="Добавьте первого пользователя">
            <Button size="sm" asChild>
              <Link href="/panel/settings/users/new">
                <Plus data-icon="inline-start" />
                Добавить пользователя
              </Link>
            </Button>
          </EmptyTableState>
        }
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(o) => !o && closeDeleteDialog()}
        title="Удалить пользователя?"
        description={
          deleteTarget
            ? `Учётная запись ${deleteTarget.email} будет удалена без возможности восстановления. Введите ваш пароль для подтверждения.`
            : "Учётная запись будет удалена без возможности восстановления. Введите ваш пароль для подтверждения."
        }
        requirePassword
        password={deletePassword}
        onPasswordChange={setDeletePassword}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
