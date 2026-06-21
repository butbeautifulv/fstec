"use client"

import type { ContactRole } from "@prisma/client"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONTACT_ROLE_HINTS,
  CONTACT_ROLE_LABELS,
  ORG_CONTACT_SCOPE_LABEL,
} from "@/lib/validations/contacts"

export const ORG_SCOPE_VALUE = "none"

export type ContactScopeContact = {
  id: number
  role: ContactRole
  subdivisionId: number | null
}

export type ContactFormValues = {
  fullName: string
  position: string
  email: string
  role: ContactRole
  subdivisionScope: string
}

type Subdivision = { id: number; name: string }

export function subdivisionScopeFromContact(contact: {
  subdivisionId: number | null
}): string {
  return contact.subdivisionId == null ? ORG_SCOPE_VALUE : String(contact.subdivisionId)
}

export function hasPrimaryInScope(
  contacts: ContactScopeContact[],
  subdivisionScope: string,
  excludeContactId?: number
): boolean {
  return contacts.some(
    (contact) =>
      contact.id !== excludeContactId &&
      contact.role === "PRIMARY" &&
      subdivisionScopeFromContact(contact) === subdivisionScope
  )
}

export function ContactFormFields({
  idPrefix,
  subdivisions,
  values,
  onChange,
  contacts,
  excludeContactId,
}: {
  idPrefix: string
  subdivisions: Subdivision[]
  values: ContactFormValues
  onChange: (patch: Partial<ContactFormValues>) => void
  contacts: ContactScopeContact[]
  excludeContactId?: number
}) {
  const roleOptions = (Object.keys(CONTACT_ROLE_LABELS) as ContactRole[]).map((value) => ({
    value,
    label: CONTACT_ROLE_LABELS[value],
  }))

  const primaryTaken = hasPrimaryInScope(
    contacts,
    values.subdivisionScope,
    excludeContactId
  )
  const showPrimaryWarning = values.role === "PRIMARY" && primaryTaken

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-fullName`}>ФИО</FieldLabel>
        <Input
          id={`${idPrefix}-fullName`}
          placeholder="Иванов Иван Иванович"
          value={values.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-email`}>Email</FieldLabel>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          placeholder="name@example.com"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-position`}>Должность</FieldLabel>
        <Input
          id={`${idPrefix}-position`}
          placeholder="Необязательно"
          value={values.position}
          onChange={(e) => onChange({ position: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-scope`}>Область</FieldLabel>
        <Select
          value={values.subdivisionScope}
          onValueChange={(subdivisionScope) => onChange({ subdivisionScope })}
        >
          <SelectTrigger id={`${idPrefix}-scope`} className="w-full min-w-0">
            <SelectValue placeholder="Область" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_SCOPE_VALUE}>{ORG_CONTACT_SCOPE_LABEL}</SelectItem>
            {subdivisions.map((sub) => (
              <SelectItem key={sub.id} value={String(sub.id)}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          {ORG_CONTACT_SCOPE_LABEL} — резервные получатели, если у подразделения нет своих
          контактов
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-role`}>Роль</FieldLabel>
        <Select
          value={values.role}
          onValueChange={(role) => onChange({ role: role as ContactRole })}
        >
          <SelectTrigger id={`${idPrefix}-role`} className="w-full min-w-0">
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
        <FieldDescription>{CONTACT_ROLE_HINTS[values.role]}</FieldDescription>
        {showPrimaryWarning ? (
          <FieldDescription className="text-destructive">
            В этой области уже назначен главный ответственный
          </FieldDescription>
        ) : null}
      </Field>
    </div>
  )
}
