import { notFound } from "next/navigation"
import { getCommittedMeasureIds } from "@/lib/measure-imports/commit"
import { getMeasureImport } from "@/lib/measure-imports"
import { defaultOrderTitle } from "@/lib/measure-imports/extract-metadata"
import { listSupervisedOrganizations } from "@/lib/organizations"
import { prisma } from "@/lib/db"
import { format } from "date-fns"

export type OrderCreateContext = {
  importRecord: {
    id: number
    documentNumber: string | null
    title: string | null
    originalName: string
  } | null
  defaultTitle: string
  defaultDue: string
  measureIds: number[]
  measures: Array<{
    id: number
    name: string
    code: string | null
    createdAt: string
  }>
  organizations: Array<{
    id: number
    name: string
    subdivisions: Array<{ id: number; name: string }>
  }>
}

function defaultDueFromDate(date: Date | null | undefined): string {
  const due =
    date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return format(due, "yyyy-MM-dd'T'HH:mm")
}

export async function loadOrderCreateContext(input: {
  importId?: number
}): Promise<OrderCreateContext> {
  const organizations = await listSupervisedOrganizations()
  const initialOrganizations = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    subdivisions: org.subdivisions.map((subdivision) => ({
      id: subdivision.id,
      name: subdivision.name,
    })),
  }))

  if (input.importId == null) {
    return {
      importRecord: null,
      defaultTitle: "",
      defaultDue: defaultDueFromDate(undefined),
      measureIds: [],
      measures: [],
      organizations: initialOrganizations,
    }
  }

  const record = await getMeasureImport(input.importId)
  if (!record || record.status !== "IMPORTED") notFound()

  const measureIds = await getCommittedMeasureIds(input.importId)
  if (measureIds.length === 0) notFound()

  const measures = await prisma.measure.findMany({
    where: { id: { in: measureIds } },
    select: { id: true, name: true, code: true, createdAt: true },
  })

  return {
    importRecord: {
      id: record.id,
      documentNumber: record.documentNumber,
      title: record.title,
      originalName: record.originalName,
    },
    defaultTitle: defaultOrderTitle(record.documentNumber, record.title),
    defaultDue: defaultDueFromDate(record.reportDueAt),
    measureIds,
    measures: measures.map((measure) => ({
      ...measure,
      createdAt: measure.createdAt.toISOString(),
    })),
    organizations: initialOrganizations,
  }
}
