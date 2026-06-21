import {
  DelayRequestStatus,
  PrismaClient,
  ResponseReviewStatus,
} from "@prisma/client"
import {
  generateMeasures,
  generateSubdivisions,
  orderTitle,
  orgAccessToken,
  pickMeasureCount,
  pickStatusAndDue,
  shuffleWithSeed,
  subdivisionAccessToken,
} from "./generators.js"
import { seedReportLink, seedWorkflowShowcaseOrder, SHOWCASE_SCENARIO_COUNT } from "./mock-workflow-showcase.js"
import { WORKFLOW_STATUS } from "../lib/statuses/workflow"

const MOCK_ORG_PREFIX = "DEV-"
const MEASURE_COUNT = 120
const ORDERS_PER_ORG = 30
const SUBDIVISIONS_PER_ORG = 7

const MOCK_ORGS = [
  { name: "ПАО «Ростех»", shortCode: `${MOCK_ORG_PREFIX}ROST` },
  { name: "ПАО «Сбербанк»", shortCode: `${MOCK_ORG_PREFIX}SBER` },
  { name: "Аэрофлот — Российские авиалинии", shortCode: `${MOCK_ORG_PREFIX}AFLT` },
  { name: "Госкорпорация «Роскосмос»", shortCode: `${MOCK_ORG_PREFIX}RSC` },
] as const

function daysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

function daysAgo(days: number) {
  return daysFromNow(-days)
}

async function getStatusMap(prisma: PrismaClient) {
  const statuses = await prisma.status.findMany()
  const byName = new Map(statuses.map((s) => [s.name, s.id]))
  return {
    notStarted: byName.get(WORKFLOW_STATUS.NOT_STARTED)!,
    inProgress: byName.get(WORKFLOW_STATUS.IN_PROGRESS)!,
    completed: byName.get(WORKFLOW_STATUS.COMPLETED)!,
  }
}

async function clearLegacyTestData(prisma: PrismaClient) {
  const legacyOrgs = await prisma.organization.findMany({
    where: {
      OR: [
        { name: { contains: "ТЕСТ", mode: "insensitive" } },
        { name: { contains: "Тест", mode: "insensitive" } },
        { name: { contains: "TEST", mode: "insensitive" } },
        { name: { contains: "DZO", mode: "insensitive" } },
        { name: { contains: "ДЗО", mode: "insensitive" } },
        {
          AND: [
            { shortCode: null },
            { name: { contains: "тест", mode: "insensitive" } },
          ],
        },
      ],
      NOT: { shortCode: { startsWith: MOCK_ORG_PREFIX } },
    },
    select: { id: true },
  })

  if (legacyOrgs.length > 0) {
    const orgIds = legacyOrgs.map((o) => o.id)
    await prisma.order.deleteMany({ where: { organizationId: { in: orgIds } } })
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } })
    console.log(`Legacy test orgs removed: ${legacyOrgs.length}`)
  }

  const orphanMeasures = await prisma.measure.findMany({
    where: {
      code: null,
      OR: [
        { name: { contains: "тест", mode: "insensitive" } },
        { name: { contains: "TEST", mode: "insensitive" } },
        { name: { contains: "ТЕСТ", mode: "insensitive" } },
      ],
    },
    select: { id: true },
  })

  if (orphanMeasures.length > 0) {
    const used = await prisma.orderItem.findMany({
      where: { measureId: { in: orphanMeasures.map((m) => m.id) } },
      select: { measureId: true },
    })
    const usedIds = new Set(used.map((u) => u.measureId))
    const deletable = orphanMeasures.filter((m) => !usedIds.has(m.id)).map((m) => m.id)
    if (deletable.length > 0) {
      await prisma.measure.deleteMany({ where: { id: { in: deletable } } })
      console.log(`Legacy test measures removed: ${deletable.length}`)
    }
  }
}

async function clearMockData(prisma: PrismaClient) {
  const mockOrgs = await prisma.organization.findMany({
    where: { shortCode: { startsWith: MOCK_ORG_PREFIX } },
    select: { id: true },
  })
  if (mockOrgs.length === 0) return

  const orgIds = mockOrgs.map((o) => o.id)
  await prisma.order.deleteMany({ where: { organizationId: { in: orgIds } } })
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } })
}

async function upsertMeasures(prisma: PrismaClient, adminId: number) {
  const generated = generateMeasures(MEASURE_COUNT)
  const measures: { id: number; code: string }[] = []

  for (const m of generated) {
    const existing = await prisma.measure.findFirst({ where: { code: m.code } })
    const row = existing
      ? await prisma.measure.update({
          where: { id: existing.id },
          data: { name: m.name, description: m.description },
        })
      : await prisma.measure.create({
          data: {
            code: m.code,
            name: m.name,
            description: m.description,
            createdById: adminId,
          },
        })
    measures.push({ id: row.id, code: m.code })
  }

  return measures
}

type OrgSeed = (typeof MOCK_ORGS)[number]

type AccessLinkRow = { org: string; scope: string; token: string }

async function seedOrganization(
  prisma: PrismaClient,
  adminId: number,
  org: OrgSeed,
  orgIndex: number,
  statusIds: Awaited<ReturnType<typeof getStatusMap>>,
  measureIds: number[]
): Promise<AccessLinkRow[]> {
  const linkRows: AccessLinkRow[] = []
  const subdivisionNames = generateSubdivisions(org.shortCode, SUBDIVISIONS_PER_ORG)

  const organization = await prisma.organization.upsert({
    where: { name: org.name },
    update: { shortCode: org.shortCode },
    create: { name: org.name, shortCode: org.shortCode },
  })

  const subdivisions = new Map<string, number>()
  for (const name of subdivisionNames) {
    const sub = await prisma.subdivision.upsert({
      where: {
        organizationId_name: { organizationId: organization.id, name },
      },
      update: {},
      create: { organizationId: organization.id, name },
    })
    subdivisions.set(name, sub.id)
  }

  await prisma.contactPerson.deleteMany({ where: { organizationId: organization.id } })
  await prisma.contactPerson.createMany({
    data: [
      {
        organizationId: organization.id,
        fullName: `Главный ответственный ${org.shortCode}`,
        position: "Начальник отдела ИБ",
        email: `${org.shortCode.toLowerCase()}.primary@example.local`,
        role: "PRIMARY",
      },
      {
        organizationId: organization.id,
        fullName: `Ответственный ${org.shortCode}`,
        position: "Специалист по ИБ",
        email: `${org.shortCode.toLowerCase()}.resp@example.local`,
        role: "RESPONSIBLE",
      },
    ],
  })

  const tokenPrefix = orgAccessToken(org.shortCode)
  await prisma.accessLink.deleteMany({
    where: { token: { startsWith: tokenPrefix } },
  })

  const orgToken = orgAccessToken(org.shortCode)
  await prisma.accessLink.create({
    data: { organizationId: organization.id, token: orgToken },
  })
  linkRows.push({ org: org.name, scope: "Организация", token: orgToken })

  for (const [index, name] of subdivisionNames.entries()) {
    const subdivisionId = subdivisions.get(name)!
    const token = subdivisionAccessToken(org.shortCode, name, index)
    await prisma.accessLink.create({
      data: { organizationId: organization.id, subdivisionId, token },
    })
    linkRows.push({ org: org.name, scope: name, token })
  }

  const subNames = subdivisionNames
  const shuffledMeasures = shuffleWithSeed(measureIds, orgIndex + 1)

  if (orgIndex === 0) {
    await seedWorkflowShowcaseOrder(prisma, {
      adminId,
      organizationId: organization.id,
      orgShortCode: org.shortCode,
      statusIds,
      measureIds: shuffledMeasures.slice(0, SHOWCASE_SCENARIO_COUNT + 2),
      subdivisionNames: subNames,
      subdivisions,
    })
  }

  for (let chunk = 0; chunk < ORDERS_PER_ORG; chunk += 10) {
    await prisma.$transaction(async (tx) => {
      for (let orderIndex = chunk; orderIndex < Math.min(chunk + 10, ORDERS_PER_ORG); orderIndex++) {
        const issuedAt = daysAgo(5 + orderIndex * 6 + orgIndex * 3)
        const defaultDueAt = daysFromNow(30 + (orderIndex % 20))

        const order = await tx.order.create({
          data: {
            title: orderTitle(org.shortCode, orderIndex),
            organizationId: organization.id,
            createdById: adminId,
            issuedAt,
            defaultDueAt,
          },
        })

        const itemCount = pickMeasureCount(orderIndex)
        const start = (orderIndex * itemCount + orgIndex * 7) % shuffledMeasures.length
        const picked = Array.from({ length: itemCount }, (_, i) =>
          shuffledMeasures[(start + i) % shuffledMeasures.length]
        )

        for (const [itemIndex, measureId] of picked.entries()) {
          const { status, dueDaysOffset } = pickStatusAndDue(itemIndex + orderIndex)
          let statusId = statusIds.notStarted
          if (status === "completed") statusId = statusIds.completed
          else if (status === "inProgress" || status === "overdue") statusId = statusIds.inProgress

          const dueAt = daysFromNow(dueDaysOffset)
          const subdivisionName = subNames[(itemIndex + orderIndex) % subNames.length]
          const subdivisionId = subdivisions.get(subdivisionName) ?? null

          const item = await tx.orderItem.create({
            data: {
              orderId: order.id,
              measureId,
              statusId,
              dueAt,
              subdivisionId,
            },
          })

          if (status === "completed") {
            await tx.response.create({
              data: {
                orderItemId: item.id,
                result: "Выполнено в полном объёме",
                commentary: "Подтверждающие документы направлены в центральный аппарат.",
                submittedByLabel: `Ответственный ${subdivisionName}`,
                submittedAt: daysAgo(2),
                reviewStatus: ResponseReviewStatus.ACCEPTED,
                reviewedById: adminId,
                reviewedAt: daysAgo(1),
              },
            })
          }

          if (status === "overdue") {
            await tx.delayRequest.create({
              data: {
                orderItemId: item.id,
                requestedDueAt: daysFromNow(30),
                justification: "Требуется дополнительное время на согласование с подрядчиком.",
                status: DelayRequestStatus.PENDING,
              },
            })

            if (itemIndex % 3 === 0) {
              await tx.response.create({
                data: {
                  orderItemId: item.id,
                  result: "Работы выполнены с опозданием, отчёт на доработке.",
                  submittedByLabel: `Ответственный ${subdivisionName}`,
                  submittedAt: daysAgo(3),
                  reviewStatus: ResponseReviewStatus.REJECTED,
                  reviewNote:
                    "Сроки нарушены без обоснования. Дополните отчёт актом о причинах задержки.",
                  reviewedById: adminId,
                  reviewedAt: daysAgo(1),
                },
              })
            }
          }

          if (status === "inProgress") {
            if (itemIndex === 1) {
              await tx.delayRequest.create({
                data: {
                  orderItemId: item.id,
                  requestedDueAt: daysFromNow(40),
                  justification: "Перенос согласован ранее из-за миграции инфраструктуры.",
                  status: DelayRequestStatus.APPROVED,
                  reviewedById: adminId,
                  reviewedAt: daysAgo(1),
                },
              })
              await tx.response.create({
                data: {
                  orderItemId: item.id,
                  result: "Частично выполнено",
                  commentary: "Внедрено на 70% рабочих мест, остальное — до конца квартала.",
                  submittedByLabel: `Ответственный ${subdivisionName}`,
                  submittedAt: daysAgo(4),
                  reviewStatus: ResponseReviewStatus.PENDING,
                },
              })
            } else if (itemIndex % 4 === 2) {
              await tx.response.create({
                data: {
                  orderItemId: item.id,
                  result: "Отчёт возвращён на доработку в массовой выборке.",
                  submittedByLabel: `Ответственный ${subdivisionName}`,
                  submittedAt: daysAgo(5),
                  reviewStatus: ResponseReviewStatus.REJECTED,
                  reviewNote: "Уточните состав выполненных работ и приложите подтверждающие материалы.",
                  reviewedById: adminId,
                  reviewedAt: daysAgo(2),
                },
              })
            } else if (itemIndex % 5 === 3) {
              await tx.response.create({
                data: {
                  orderItemId: item.id,
                  result: "Первый отчёт отклонён.",
                  submittedByLabel: `Ответственный ${subdivisionName}`,
                  submittedAt: daysAgo(6),
                  reviewStatus: ResponseReviewStatus.REJECTED,
                  reviewNote: "Неполный состав документов.",
                  reviewedById: adminId,
                  reviewedAt: daysAgo(5),
                },
              })
              await tx.response.create({
                data: {
                  orderItemId: item.id,
                  result: "Повторный отчёт после доработки.",
                  submittedByLabel: `Ответственный ${subdivisionName}`,
                  submittedAt: daysAgo(2),
                  reviewStatus: ResponseReviewStatus.PENDING,
                },
              })
            }
          }
        }
      }
    })
  }

  return linkRows
}

export async function seedMockData(
  prisma: PrismaClient,
  adminId: number,
  options: { force?: boolean } = {}
) {
  if (options.force) {
    await clearLegacyTestData(prisma)
    await clearMockData(prisma)
    console.log("Mock data cleared")
  } else {
    const existing = await prisma.organization.findFirst({
      where: { shortCode: { startsWith: MOCK_ORG_PREFIX } },
    })
    if (existing) {
      console.log(
        "Mock data already exists — skipping. Run SEED_MOCK=force npm run db:seed to reset."
      )
      return
    }
  }

  const statusIds = await getStatusMap(prisma)
  const measures = await upsertMeasures(prisma, adminId)
  const measureIds = measures.map((m) => m.id)

  const allLinks: AccessLinkRow[] = []
  for (const [orgIndex, org] of MOCK_ORGS.entries()) {
    const links = await seedOrganization(
      prisma,
      adminId,
      org,
      orgIndex,
      statusIds,
      measureIds
    )
    allLinks.push(...links)
  }

  const reportToken = await seedReportLink(prisma)

  const orderCount = await prisma.order.count({
    where: { title: { startsWith: "[DEV]" } },
  })

  console.log("Mock data seeded:")
  console.log(`  • ${MOCK_ORGS.length} organizations`)
  console.log(`  • ${SUBDIVISIONS_PER_ORG} subdivisions per org`)
  console.log(`  • ${measures.length} measures in catalog`)
  console.log(`  • ${orderCount} orders (${ORDERS_PER_ORG} per org)`)
  console.log(`  • ${allLinks.length} access links`)
  console.log(`  • report link: /report/${reportToken}`)
  console.log(`  • workflow showcase order in ${MOCK_ORGS[0].name} (public: /p/${orgAccessToken(MOCK_ORGS[0].shortCode)}/reports)`)
  console.log("")
  console.log("Public dev links:")
  console.table(
    allLinks.map((l) => ({
      organization: l.org,
      scope: l.scope,
      url: `/p/${l.token}`,
    }))
  )
}
