"use client"

import { useMemo, useState } from "react"
import type { ContactRole } from "@prisma/client"
import { ConfirmDeleteAlert } from "@/components/platform/crud/confirm-delete-alert"
import { TableRowActions } from "@/components/platform/crud/table-row-actions"
import { DataTableShell } from "@/components/platform/data-table-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { notify } from "@/lib/ui/feedback"
import { CONTACT_ROLE_LABELS } from "@/lib/validations/contacts"
import { Plus, Trash2 } from "lucide-react"

type ContactRow = {
  id: number
  fullName: string
  position: string | null
  email: string
  role: ContactRole
}

export function OrgContactsPanel({
  organizationId,
  initialContacts,
}: {
  organizationId: number
  initialContacts: ContactRow[]
}) {
  const [contacts, setContacts] = useState(initialContacts)
  const [fullName, setFullName] = useState("")
  const [position, setPosition] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<ContactRole>("RESPONSIBLE")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const roleOptions = useMemo(
    () =>
      (Object.keys(CONTACT_ROLE_LABELS) as ContactRole[]).map((value) => ({
        value,
        label: CONTACT_ROLE_LABELS[value],
      })),
    []
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return
    setSaving(true)
    const res = await fetch(`/api/organizations/${organizationId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        position: position.trim() || null,
        email: email.trim(),
        role,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      notify.error(data.error ?? "Не удалось добавить контакт")
      return
    }
    const contact = await res.json()
    setContacts((prev) => [...prev, contact])
    setFullName("")
    setPosition("")
    setEmail("")
    setRole("RESPONSIBLE")
    notify.success("Контакт добавлен")
  }

  async function confirmDelete() {
    if (deleteId == null) return
    setDeleting(true)
    const res = await fetch(
      `/api/organizations/${organizationId}/contacts/${deleteId}`,
      { method: "DELETE" }
    )
    setDeleting(false)
    if (!res.ok) {
      notify.error("Не удалось удалить контакт")
      return
    }
    setContacts((prev) => prev.filter((contact) => contact.id !== deleteId))
    setDeleteId(null)
    notify.success("Контакт удалён")
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="ФИО"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          placeholder="Должность"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select value={role} onValueChange={(value) => setRole(value as ContactRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={saving}>
          <Plus data-icon="inline-start" />
          Добавить
        </Button>
      </form>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Контакты не добавлены
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.fullName}</TableCell>
                  <TableCell>{contact.position ?? "—"}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{CONTACT_ROLE_LABELS[contact.role]}</TableCell>
                  <TableCell>
                    <TableRowActions
                      actions={[
                        {
                          label: "Удалить",
                          icon: <Trash2 data-icon="inline-start" />,
                          destructive: true,
                          onClick: () => setDeleteId(contact.id),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableShell>

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
