export type GeneratedMeasure = {
  code: string
  name: string
  description: string
}

const MEASURE_DOMAINS = [
  { prefix: "IDM", topic: "идентификации и управлению доступом" },
  { prefix: "AUD", topic: "аудиту и регистрации событий безопасности" },
  { prefix: "NET", topic: "сетевой защите и сегментации" },
  { prefix: "AVZ", topic: "антивирусной защите" },
  { prefix: "BKP", topic: "резервному копированию и восстановлению" },
  { prefix: "CRY", topic: "криптографической защите информации" },
  { prefix: "PHY", topic: "физической защите и контролю доступа" },
  { prefix: "INT", topic: "контролю целостности программного обеспечения" },
  { prefix: "UPD", topic: "управлению обновлениями ПО" },
  { prefix: "HR", topic: "обучению и инструктажу персонала" },
  { prefix: "INC", topic: "реагированию на инциденты ИБ" },
  { prefix: "CFG", topic: "управлению конфигурациями" },
] as const

const MEASURE_ACTIONS = [
  "Организация процессов",
  "Контроль выполнения требований",
  "Документирование процедур",
  "Мониторинг показателей",
  "Периодическая проверка",
  "Актуализация регламентов",
  "Внедрение технических средств",
  "Назначение ответственных",
  "Согласование с подразделениями",
  "Отчётность по результатам",
] as const

const SUBDIVISION_TEMPLATES = [
  "Центральный аппарат",
  "Департамент информационной безопасности",
  "IT-блок",
  "Цифровые сервисы",
  "Технический центр",
  "Коммерческий блок",
  "Юридический департамент",
  "Финансовый блок",
  "Управление персоналом",
  "Служба внутреннего контроля",
  "Операционный департамент",
  "Аналитический центр",
  "Инфраструктурный блок",
  "Центр разработки",
  "Управление закупок",
] as const

export type StatusPick = "completed" | "inProgress" | "overdue"

export function generateMeasures(count = 120): GeneratedMeasure[] {
  const measures: GeneratedMeasure[] = []
  let index = 0

  while (measures.length < count) {
    const domain = MEASURE_DOMAINS[index % MEASURE_DOMAINS.length]
    const variant = Math.floor(index / MEASURE_DOMAINS.length) + 1
    const action = MEASURE_ACTIONS[index % MEASURE_ACTIONS.length]
    const code = `${domain.prefix}.${variant}`

    measures.push({
      code,
      name: `${action} в области ${domain.topic} (${code})`,
      description: `${action} мер по ${domain.topic} в соответствии с требованиями ФСТЭК.`,
    })
    index++
  }

  return measures.slice(0, count)
}

export function generateSubdivisions(_orgShortCode: string, count = 7): string[] {
  return SUBDIVISION_TEMPLATES.slice(0, count)
}

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
}

export function slugifySubdivision(name: string, fallbackIndex?: number): string {
  const slug = name
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? (/[a-z0-9]/.test(char) ? char : "-"))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)

  if (slug) return slug
  return `sub-${fallbackIndex ?? 0}`
}

export function orderTitle(orgCode: string, index: number): string {
  return `[DEV] Приказ №${index + 1} — ${orgCode}`
}

export function pickStatusAndDue(itemIndex: number): {
  status: StatusPick
  dueDaysOffset: number
} {
  const cycle = itemIndex % 4
  if (cycle === 0) return { status: "completed", dueDaysOffset: -5 }
  if (cycle === 1) return { status: "inProgress", dueDaysOffset: 20 }
  if (cycle === 2) return { status: "overdue", dueDaysOffset: -7 }
  return { status: "inProgress", dueDaysOffset: 14 }
}

export function pickMeasureCount(orderIndex: number): number {
  return 3 + (orderIndex % 3)
}

export function orgAccessToken(shortCode: string): string {
  return `dev-${shortCode.replace(/^DEV-/, "").toLowerCase()}`
}

export function subdivisionAccessToken(
  shortCode: string,
  subdivisionName: string,
  fallbackIndex?: number
): string {
  return `dev-${shortCode.replace(/^DEV-/, "").toLowerCase()}-${slugifySubdivision(subdivisionName, fallbackIndex)}`
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let s = seed
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
