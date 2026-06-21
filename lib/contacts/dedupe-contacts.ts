import type { ContactRole } from "@prisma/client"

const ROLE_ORDER: Record<ContactRole, number> = {
  PRIMARY: 0,
  RESPONSIBLE: 1,
  NOTIFY: 2,
}

export function dedupeAndSortContacts<
  T extends { email: string; role: ContactRole; fullName: string },
>(contacts: T[]): T[] {
  const deduped = new Map<string, T>()
  for (const contact of contacts) {
    const key = contact.email.trim().toLowerCase()
    if (!deduped.has(key)) {
      deduped.set(key, contact)
    }
  }

  return [...deduped.values()].sort(
    (a, b) =>
      ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
      a.fullName.localeCompare(b.fullName)
  )
}
