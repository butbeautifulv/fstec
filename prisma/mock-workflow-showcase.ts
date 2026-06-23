import {
  DelayRequestStatus,
  PrismaClient,
  ResponseReviewStatus,
} from "@prisma/client"

type StatusIds = {
  inProgress: number
  completed: number
}

type ShowcaseScenario = {
  label: string
  statusKey: keyof StatusIds
  dueDaysOffset: number
  responses?: {
    result: string
    commentary?: string
    submittedByLabel: string
    submittedDaysAgo: number
    reviewStatus: ResponseReviewStatus
    reviewNote?: string
    reviewedDaysAgo?: number
  }[]
  delayRequest?: {
    requestedDaysFromNow: number
    justification: string
    status: DelayRequestStatus
    reviewedDaysAgo?: number
  }
}

const SHOWCASE_SCENARIOS: ShowcaseScenario[] = [
  {
    label: "В работе — отчёт не приложен",
    statusKey: "inProgress",
    dueDaysOffset: 21,
  },
  {
    label: "В работе — отчёт не отправлен",
    statusKey: "inProgress",
    dueDaysOffset: 18,
  },
  {
    label: "На проверке",
    statusKey: "inProgress",
    dueDaysOffset: 16,
    responses: [
      {
        result: "Выполнены все требования по мере, акт внедрения подписан.",
        commentary: "Приложены скриншоты настроек и журнал регистрации.",
        submittedByLabel: "Иванов И.И.",
        submittedDaysAgo: 1,
        reviewStatus: ResponseReviewStatus.PENDING,
      },
    ],
  },
  {
    label: "Не принят — требуется доработка",
    statusKey: "inProgress",
    dueDaysOffset: 12,
    responses: [
      {
        result: "Мера выполнена частично, ожидаем согласования.",
        submittedByLabel: "Петров П.П.",
        submittedDaysAgo: 3,
        reviewStatus: ResponseReviewStatus.REJECTED,
        reviewNote:
          "Не приложены подтверждающие документы. Уточните перечень внедрённых средств защиты и приложите сканы актов.",
        reviewedDaysAgo: 1,
      },
    ],
  },
  {
    label: "Повторная отправка после возврата",
    statusKey: "inProgress",
    dueDaysOffset: 10,
    responses: [
      {
        result: "Первоначальный отчёт без приложений.",
        submittedByLabel: "Сидоров С.С.",
        submittedDaysAgo: 5,
        reviewStatus: ResponseReviewStatus.REJECTED,
        reviewNote: "Добавьте приложения и укажите сроки завершения работ.",
        reviewedDaysAgo: 4,
      },
      {
        result: "Доработанный отчёт с приложениями и актом внедрения.",
        commentary: "Исправлены замечания ревьюера, документы приложены.",
        submittedByLabel: "Сидоров С.С.",
        submittedDaysAgo: 2,
        reviewStatus: ResponseReviewStatus.PENDING,
      },
    ],
  },
  {
    label: "Принят — мера выполнена",
    statusKey: "completed",
    dueDaysOffset: -3,
    responses: [
      {
        result: "Мера выполнена в полном объёме, контроль пройден.",
        commentary: "Отчёт согласован с департаментом ИБ.",
        submittedByLabel: "Козлов К.К.",
        submittedDaysAgo: 7,
        reviewStatus: ResponseReviewStatus.ACCEPTED,
        reviewedDaysAgo: 5,
      },
    ],
  },
  {
    label: "Просрочено + возврат на доработку",
    statusKey: "inProgress",
    dueDaysOffset: -10,
    responses: [
      {
        result: "Работы начаты, требуется дополнительное время.",
        submittedByLabel: "Новиков Н.Н.",
        submittedDaysAgo: 4,
        reviewStatus: ResponseReviewStatus.REJECTED,
        reviewNote:
          "Отчёт не содержит план-график устранения замечений. Укажите конкретные сроки и ответственных.",
        reviewedDaysAgo: 2,
      },
    ],
  },
  {
    label: "На проверке + заявка на перенос",
    statusKey: "inProgress",
    dueDaysOffset: 5,
    responses: [
      {
        result: "Внедрение на 80% рабочих мест.",
        submittedByLabel: "Морозова М.М.",
        submittedDaysAgo: 2,
        reviewStatus: ResponseReviewStatus.PENDING,
      },
    ],
    delayRequest: {
      requestedDaysFromNow: 45,
      justification: "Задержка поставки оборудования, прошу перенести срок исполнения.",
      status: DelayRequestStatus.PENDING,
    },
  },
  {
    label: "Перенос отклонён",
    statusKey: "inProgress",
    dueDaysOffset: -2,
    delayRequest: {
      requestedDaysFromNow: 60,
      justification: "Недостаточно ресурсов на текущий квартал.",
      status: DelayRequestStatus.REJECTED,
      reviewedDaysAgo: 1,
    },
  },
  {
    label: "Перенос согласован",
    statusKey: "inProgress",
    dueDaysOffset: 30,
    delayRequest: {
      requestedDaysFromNow: 60,
      justification: "Согласовано с центральным аппаратом — перенос из-за миграции.",
      status: DelayRequestStatus.APPROVED,
      reviewedDaysAgo: 2,
    },
  },
]

export const SHOWCASE_SCENARIO_COUNT = SHOWCASE_SCENARIOS.length

function daysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

function daysAgo(days: number) {
  return daysFromNow(-days)
}

export async function seedWorkflowShowcaseOrder(
  prisma: PrismaClient,
  params: {
    adminId: number
    organizationId: number
    orgShortCode: string
    statusIds: StatusIds
    measureIds: number[]
    subdivisionNames: string[]
    subdivisions: Map<string, number>
  }
) {
  const {
    adminId,
    organizationId,
    orgShortCode,
    statusIds,
    measureIds,
    subdivisionNames,
    subdivisions,
  } = params

  const order = await prisma.order.create({
    data: {
      title: `[DEV] Демо — отчёты и статусы (${orgShortCode})`,
      organizationId,
      createdById: adminId,
      issuedAt: daysAgo(14),
      defaultDueAt: daysFromNow(30),
    },
  })

  for (const [index, scenario] of SHOWCASE_SCENARIOS.entries()) {
    const measureId = measureIds[index % measureIds.length]
    const subdivisionName = subdivisionNames[index % subdivisionNames.length]
    const subdivisionId = subdivisions.get(subdivisionName) ?? null

    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        measureId,
        statusId: statusIds[scenario.statusKey],
        dueAt: daysFromNow(scenario.dueDaysOffset),
        subdivisionId,
      },
    })

    for (const response of scenario.responses ?? []) {
      await prisma.response.create({
        data: {
          orderItemId: item.id,
          result: `[${scenario.label}] ${response.result}`,
          commentary: response.commentary,
          submittedByLabel: response.submittedByLabel,
          submittedAt: daysAgo(response.submittedDaysAgo),
          reviewStatus: response.reviewStatus,
          reviewNote: response.reviewNote,
          reviewedById:
            response.reviewStatus !== ResponseReviewStatus.PENDING ? adminId : null,
          reviewedAt:
            response.reviewedDaysAgo != null ? daysAgo(response.reviewedDaysAgo) : null,
        },
      })
    }

    if (scenario.delayRequest) {
      const delay = scenario.delayRequest
      await prisma.delayRequest.create({
        data: {
          orderItemId: item.id,
          requestedDueAt: daysFromNow(delay.requestedDaysFromNow),
          justification: `[${scenario.label}] ${delay.justification}`,
          status: delay.status,
          reviewedById: delay.status !== DelayRequestStatus.PENDING ? adminId : null,
          reviewedAt:
            delay.reviewedDaysAgo != null ? daysAgo(delay.reviewedDaysAgo) : null,
        },
      })
    }
  }

  return order.id
}

export async function seedReportLink(prisma: PrismaClient) {
  const token = "dev-report"
  await prisma.reportLink.deleteMany({ where: { token } })
  await prisma.reportLink.create({ data: { token } })
  return token
}
