"use client"

import { useMemo, useState } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import type { ContactRole } from "@prisma/client"
import {
  ContactEditDialog,
  type EditableContact,
} from "@/components/platform/contact-edit-dialog"
import {
  ContactFormFields,
  ORG_SCOPE_VALUE,
  type ContactFormValues,
} from "@/components/platform/contact-form-fields"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { EmptyTableState } from "@/components/platform/crud/empty-table-state"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { actionsColumnMeta, colMeta, textColumnMeta } from "@/lib/data-table/column-meta"
import { facetedFilter } from "@/lib/data-table/faceted-column"
import { TextCell, TruncatedCell } from "@/lib/data-table/text-cell"
import { notify } from "@/lib/ui/feedback"
import {
  CONTACT_ROLE_LABELS,
  ORG_CONTACT_SCOPE_LABEL,
} from "@/lib/validations/contacts"
import { Pencil, Plus, Trash2 } from "lucide-react"

type Subdivision = { id: number; name: string }

type ContactRow = EditableContact

const ROLE_SORT_ORDER: Record<ContactRole, number> = {
  PRIMARY: 0,
  RESPONSIBLE: 1,
  NOTIFY: 2,
}

const DEFAULT_SORTING: SortingState = [
  { id: "role", desc: false },
  { id: "fullName", desc: false },
]

function contactScopeLabel(contact: ContactRow): string {
  return contact.subdivision?.name ?? ORG_CONTACT_SCOPE_LABEL
}

export function OrgContactsPanel({
  organizationId,
  subdivisions,
  initialContacts,
}: {
  organizationId: number
  subdivisions: Subdivision[]
  initialContacts: ContactRow[]
}) {
  const [contacts, setContacts] = useState(initialContacts)
  const [formValues, setFormValues] = useState<ContactFormValues>({
    fullName: "",
    position: "",
    email: "",
    role: "RESPONSIBLE",
    subdivisionScope: ORG_SCOPE_VALUE,
  })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editContact, setEditContact] = useState<ContactRow | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formValues.fullName.trim() || !formValues.email.trim()) return
    setSaving(true)

    const body = {
      fullName: formValues.fullName.trim(),
      position: formValues.position.trim() || null,
      email: formValues.email.trim(),
      role: formValues.role,
    }

    const url =
      formValues.subdivisionScope === ORG_SCOPE_VALUE
        ? `/api/organizations/${organizationId}/contacts`
        : `/api/subdivisions/${formValues.subdivisionScope}/contacts`

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось добавить контакт")
      return
    }
    const contact = await res.json()
    const selectedSubdivision =
      formValues.subdivisionScope === ORG_SCOPE_VALUE
        ? null
        : subdivisions.find((sub) => String(sub.id) === formValues.subdivisionScope) ?? null

    setContacts((prev) => [
      ...prev,
      {
        ...contact,
        subdivisionId: selectedSubdivision?.id ?? null,
        subdivision: selectedSubdivision,
      },
    ])
    setFormValues({
      fullName: "",
      position: "",
      email: "",
      role: "RESPONSIBLE",
      subdivisionScope: ORG_SCOPE_VALUE,
    })
    notify.success("Контакт добавлен")
  }

  async function confirmDelete() {
    if (deleteId == null) return
    setDeleting(true)
    const res = await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok) {
      notify.error("Не удалось удалить контакт")
      return
    }
    setContacts((prev) => prev.filter((contact) => contact.id !== deleteId))
    setDeleteId(null)
    notify.success("Контакт удалён")
  }

  const columns = useMemo<ColumnDef<ContactRow>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ФИО" />
        ),
        cell: ({ row }) => <TextCell text={row.original.fullName} />,
        meta: textColumnMeta("ФИО", "w-[20%]"),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => row.original.email,
        meta: textColumnMeta("Email", "w-[22%]", { faceted: false }),
      },
      {
        id: "position",
        accessorFn: (row) => row.position ?? "—",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Должность" />
        ),
        cell: ({ row }) => (
          <TruncatedCell text={row.original.position ?? "—"} />
        ),
        meta: colMeta("Должность", { faceted: false, cellClassName: "max-w-0 w-[16%]" }),
      },
      {
        id: "subdivision",
        accessorFn: (row) => contactScopeLabel(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Область" />
        ),
        cell: ({ row }) => (
          <TruncatedCell text={contactScopeLabel(row.original)} />
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        meta: colMeta("Область", { cellClassName: "max-w-0 w-[18%]" }),
      },
      {
        id: "role",
        accessorFn: (row) => CONTACT_ROLE_LABELS[row.role],
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Роль" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{CONTACT_ROLE_LABELS[row.original.role]}</Badge>
        ),
        enableColumnFilter: true,
        filterFn: facetedFilter,
        sortingFn: (a, b) => {
          const roleDiff =
            ROLE_SORT_ORDER[a.original.role] - ROLE_SORT_ORDER[b.original.role]
          if (roleDiff !== 0) return roleDiff
          return a.original.fullName.localeCompare(b.original.fullName, "ru")
        },
        meta: colMeta("Роль", {
          cellClassName: "w-[14%]",
          valueLabels: CONTACT_ROLE_LABELS,
        }),
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
                label: "Изменить",
                icon: <Pencil data-icon="inline-start" />,
                onClick: () => setEditContact(row.original),
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
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <FieldGroup>
          <ContactFormFields
            idPrefix="add-contact"
            subdivisions={subdivisions}
            values={formValues}
            onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
            contacts={contacts}
          />
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Plus data-icon="inline-start" />
            Добавить
          </Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        data={contacts}
        pageSize={25}
        showColumnToggle={false}
        initialSorting={DEFAULT_SORTING}
        searchPlaceholder="Поиск по ФИО, email, должности…"
        globalFilterFn={(row, _columnId, filterValue) => {
          const q = String(filterValue).toLowerCase()
          if (!q) return true
          const contact = row
          return [
            contact.fullName,
            contact.email,
            contact.position ?? "",
            contactScopeLabel(contact),
            CONTACT_ROLE_LABELS[contact.role],
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        }}
        empty={
          <EmptyTableState
            title="Контакты не добавлены"
            description="Добавьте получателей email-оповещений по поручениям"
          />
        }
      />

      <ContactEditDialog
        contact={editContact}
        subdivisions={subdivisions}
        contacts={contacts}
        open={editContact != null}
        onOpenChange={(open) => {
          if (!open) setEditContact(null)
        }}
        onSaved={(updated) => {
          setContacts((prev) =>
            prev.map((contact) => (contact.id === updated.id ? updated : contact))
          )
        }}
      />

      <ConfirmDeleteAlert
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Удалить контакт?"
        description="Контакт будет удалён из списка оповещений."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
