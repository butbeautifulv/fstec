"use client"

import { useState } from "react"
import type { ContactRole } from "@prisma/client"
import {
  ContactFormFields,
  ORG_SCOPE_VALUE,
  subdivisionScopeFromContact,
  type ContactFormValues,
} from "@/components/platform/contact-form-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { notify } from "@/lib/ui/feedback"

type Subdivision = { id: number; name: string }

export type EditableContact = {
  id: number
  fullName: string
  position: string | null
  email: string
  role: ContactRole
  subdivisionId: number | null
  subdivision: Subdivision | null
}

function contactFormValues(contact: EditableContact): ContactFormValues {
  return {
    fullName: contact.fullName,
    position: contact.position ?? "",
    email: contact.email,
    role: contact.role,
    subdivisionScope: subdivisionScopeFromContact(contact),
  }
}

function ContactEditDialogContent({
  contact,
  subdivisions,
  contacts,
  onOpenChange,
  onSaved,
}: {
  contact: EditableContact
  subdivisions: Subdivision[]
  contacts: EditableContact[]
  onOpenChange: (open: boolean) => void
  onSaved: (contact: EditableContact) => void
}) {
  const [values, setValues] = useState<ContactFormValues>(() => contactFormValues(contact))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.fullName.trim() || !values.email.trim()) return

    setSaving(true)
    const subdivisionId =
      values.subdivisionScope === ORG_SCOPE_VALUE
        ? null
        : Number(values.subdivisionScope)

    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: values.fullName.trim(),
        position: values.position.trim() || null,
        email: values.email.trim(),
        role: values.role,
        subdivisionId,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      notify.error(data?.error ?? "Не удалось сохранить контакт")
      return
    }

    const updated = await res.json()
    const selectedSubdivision =
      values.subdivisionScope === ORG_SCOPE_VALUE
        ? null
        : subdivisions.find((sub) => String(sub.id) === values.subdivisionScope) ??
          updated.subdivision ??
          null

    onSaved({
      ...updated,
      subdivisionId: selectedSubdivision?.id ?? null,
      subdivision: selectedSubdivision,
    })
    notify.success("Контакт обновлён")
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Изменить контакт</DialogTitle>
        <DialogDescription>
          Получатель email-оповещений по поручениям и мерам
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <FieldGroup>
          <ContactFormFields
            idPrefix="edit-contact"
            subdivisions={subdivisions}
            values={values}
            onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            contacts={contacts}
            excludeContactId={contact.id}
          />
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="size-4" /> : "Сохранить"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function ContactEditDialog({
  contact,
  subdivisions,
  contacts,
  open,
  onOpenChange,
  onSaved,
}: {
  contact: EditableContact | null
  subdivisions: Subdivision[]
  contacts: EditableContact[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (contact: EditableContact) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {contact ? (
          <ContactEditDialogContent
            key={contact.id}
            contact={contact}
            subdivisions={subdivisions}
            contacts={contacts}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
