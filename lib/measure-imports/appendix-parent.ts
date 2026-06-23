import { prisma } from "@/lib/db"

export async function suggestAppendixParent(input: {
  documentNumber: string | null
  originalName: string
}): Promise<number | null> {
  if (!input.documentNumber) return null
  const nameLower = input.originalName.toLowerCase()
  if (!nameLower.includes("приложение")) return null

  const parent = await prisma.measureImport.findFirst({
    where: {
      documentNumber: input.documentNumber,
      kind: "LETTER",
      parentImportId: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  return parent?.id ?? null
}

export function referencesAppendix(paragraphs: string[]): boolean {
  return paragraphs.some((p) => /Приложение\s*:/i.test(p))
}
