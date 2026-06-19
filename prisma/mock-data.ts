import {
  DelayRequestStatus,
  PrismaClient,
} from "@prisma/client"
import { WORKFLOW_STATUS } from "../lib/statuses/workflow"

const MOCK_ORG_PREFIX = "DEV-"

const MOCK_ORGS = [
  {
    name: "ПАО «Ростех»",
    shortCode: `${MOCK_ORG_PREFIX}ROST`,
    subdivisions: ["Центральный аппарат", "Авиадвигатели", "Высокоточные комплексы"],
    accessToken: "dev-rostec",
  },
  {
    name: "ПАО «Сбербанк»",
    shortCode: `${MOCK_ORG_PREFIX}SBER`,
    subdivisions: ["IT-блок", "Департамент безопасности", "Цифровые сервисы"],
    accessToken: "dev-sber",
    subdivisionToken: "dev-sber-it",
    subdivisionTokenFor: "IT-блок",
  },
  {
    name: "Аэрофлот — Российские авиалинии",
    shortCode: `${MOCK_ORG_PREFIX}AFLT`,
    subdivisions: ["Коммерческий блок", "Технический центр"],
    accessToken: "dev-aeroflot",
  },
  {
    name: "Госкорпорация «Роскосмос»",
    shortCode: `${MOCK_ORG_PREFIX}RSC`,
    subdivisions: ["Центр управления полётами", "НПО им. Лавочкина"],
    accessToken: "dev-roscosmos",
  },
] as const

const MOCK_MEASURES = [
  {
    code: "IDM.1",
    name: "Идентификация и аутентификация субъектов доступа",
    description: "Организация идентификации и аутентификации пользователей и процессов.",
  },
  {
    code: "IDM.2",
    name: "Управление учётными записями и правами доступа",
    description: "Создание, изменение, блокирование и удаление учётных записей.",
  },
  {
    code: "AUD.1",
    name: "Регистрация событий безопасности",
    description: "Сбор, запись и хранение событий безопасности информации.",
  },
  {
    code: "AUD.2",
    name: "Анализ зарегистрированных событий безопасности",
    description: "Регулярный анализ журналов и реагирование на инциденты.",
  },
  {
    code: "AVZ.1",
    name: "Антивирусная защита",
    description: "Обнаружение и нейтрализация вредоносного программного обеспечения.",
  },
  {
    code: "NET.1",
    name: "Межсетевое экранирование",
    description: "Контроль сетевого трафика на границах сегментов.",
  },
  {
    code: "BKP.1",
    name: "Резервное копирование и восстановление",
    description: "Регламент резервного копирования критичных данных.",
  },
  {
    code: "CRY.1",
    name: "Криптографическая защита информации",
    description: "Применение СКЗИ для защиты каналов и носителей.",
  },
  {
    code: "PHY.1",
    name: "Защита помещений и оборудования от НСД",
    description: "Контроль физического доступа к серверным и рабочим зонам.",
  },
  {
    code: "INT.1",
    name: "Контроль целостности программного обеспечения",
    description: "Контроль неизменности системного и прикладного ПО.",
  },
  {
    code: "UPD.1",
    name: "Управление обновлениями программного обеспечения",
    description: "Планирование и установка обновлений безопасности.",
  },
  {
    code: "HR.1",
    name: "Обучение и инструктаж персонала по ИБ",
    description: "Периодическое обучение сотрудников требованиям ИБ.",
  },
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

async function clearMockData(prisma: PrismaClient) {
  const mockOrgs = await prisma.organization.findMany({
    where: { shortCode: { startsWith: MOCK_ORG_PREFIX } },
    select: { id: true },
  })
  if (mockOrgs.length === 0) return

  const orgIds = mockOrgs.map((o) => o.id)

  await prisma.order.deleteMany({
    where: { organizationId: { in: orgIds } },
  })

  await prisma.organization.deleteMany({
    where: { id: { in: orgIds } },
  })
}

async function upsertMeasures(prisma: PrismaClient, adminId: number) {
  const measures: { id: number; code: string }[] = []

  for (const m of MOCK_MEASURES) {
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

async function seedOrganization(
  prisma: PrismaClient,
  adminId: number,
  org: OrgSeed,
  statusIds: Awaited<ReturnType<typeof getStatusMap>>,
  measureIds: number[]
) {
  const organization = await prisma.organization.upsert({
    where: { name: org.name },
    update: { shortCode: org.shortCode },
    create: { name: org.name, shortCode: org.shortCode },
  })

  const subdivisions = new Map<string, number>()
  for (const name of org.subdivisions) {
    const sub = await prisma.subdivision.upsert({
      where: {
        organizationId_name: { organizationId: organization.id, name },
      },
      update: {},
      create: { organizationId: organization.id, name },
    })
    subdivisions.set(name, sub.id)
  }

  const tokens: string[] = [org.accessToken]
  if ("subdivisionToken" in org) tokens.push(org.subdivisionToken)

  await prisma.accessLink.deleteMany({
    where: { token: { in: tokens } },
  })

  await prisma.accessLink.create({
    data: {
      organizationId: organization.id,
      token: org.accessToken,
    },
  })

  if ("subdivisionToken" in org && org.subdivisionTokenFor) {
    const subdivisionId = subdivisions.get(org.subdivisionTokenFor)
    if (subdivisionId) {
      await prisma.accessLink.create({
        data: {
          organizationId: organization.id,
          subdivisionId,
          token: org.subdivisionToken,
        },
      })
    }
  }

  const existingOrder = await prisma.order.findFirst({
    where: {
      organizationId: organization.id,
      title: { startsWith: "[DEV]" },
    },
  })
  if (existingOrder) return organization

  const orderTitles = [
    `[DEV] Приказ о выполнении мер ИБ — ${org.shortCode}`,
    `[DEV] План защиты персональных данных — ${org.shortCode}`,
  ]

  for (const [orderIndex, title] of orderTitles.entries()) {
    const issuedAt = daysAgo(30 + orderIndex * 14)
    const defaultDueAt = daysFromNow(45 - orderIndex * 10)

    const order = await prisma.order.create({
      data: {
        title,
        organizationId: organization.id,
        createdById: adminId,
        issuedAt,
        defaultDueAt,
      },
    })

    const subNames = [...org.subdivisions]
    const pickedMeasures = measureIds.slice(
      orderIndex * 4,
      orderIndex * 4 + Math.min(6, measureIds.length - orderIndex * 4)
    )

    for (const [itemIndex, measureId] of pickedMeasures.entries()) {
      const statusCycle = itemIndex % 4
      let statusId = statusIds.notStarted
      let dueAt = defaultDueAt

      if (statusCycle === 0) {
        statusId = statusIds.completed
        dueAt = daysAgo(5)
      } else if (statusCycle === 1) {
        statusId = statusIds.inProgress
        dueAt = daysFromNow(20)
      } else if (statusCycle === 2) {
        statusId = statusIds.inProgress
        dueAt = daysAgo(7)
      } else {
        statusId = statusIds.notStarted
        dueAt = daysAgo(3)
      }

      const subdivisionName = subNames[itemIndex % subNames.length]
      const subdivisionId = subdivisions.get(subdivisionName) ?? null

      const item = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          measureId,
          statusId,
          dueAt,
          subdivisionId,
        },
      })

      if (statusId === statusIds.completed) {
        await prisma.response.create({
          data: {
            orderItemId: item.id,
            result: "Выполнено в полном объёме",
            commentary: "Подтверждающие документы направлены в центральный аппарат.",
            submittedByLabel: `Ответственный ${subdivisionName}`,
            submittedAt: daysAgo(2),
          },
        })
      }

      if (statusCycle === 2) {
        await prisma.delayRequest.create({
          data: {
            orderItemId: item.id,
            requestedDueAt: daysFromNow(30),
            justification: "Требуется дополнительное время на согласование с подрядчиком.",
            status: DelayRequestStatus.PENDING,
          },
        })
      }

      if (statusCycle === 1 && itemIndex === 1) {
        await prisma.delayRequest.create({
          data: {
            orderItemId: item.id,
            requestedDueAt: daysFromNow(40),
            justification: "Перенос согласован ранее из-за миграции инфраструктуры.",
            status: DelayRequestStatus.APPROVED,
            reviewedById: adminId,
            reviewedAt: daysAgo(1),
          },
        })
        await prisma.response.create({
          data: {
            orderItemId: item.id,
            result: "Частично выполнено",
            commentary: "Внедрено на 70% рабочих мест, остальное — до конца квартала.",
            submittedByLabel: `Ответственный ${subdivisionName}`,
            submittedAt: daysAgo(4),
          },
        })
      }
    }
  }

  return organization
}

export async function seedMockData(
  prisma: PrismaClient,
  adminId: number,
  options: { force?: boolean } = {}
) {
  if (options.force) {
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

  for (const org of MOCK_ORGS) {
    await seedOrganization(prisma, adminId, org, statusIds, measureIds)
  }

  console.log("Mock data seeded:")
  console.log(`  • ${MOCK_ORGS.length} organizations with subdivisions and access links`)
  console.log(`  • ${MOCK_MEASURES.length} measures in catalog`)
  console.log(`  • orders with mixed statuses, responses, and delay requests`)
  console.log("")
  console.log("Public dev links:")
  for (const org of MOCK_ORGS) {
    console.log(`  • ${org.name}: /p/${org.accessToken}`)
    if ("subdivisionToken" in org) {
      console.log(`    └ ${org.subdivisionTokenFor}: /p/${org.subdivisionToken}`)
    }
  }
}
