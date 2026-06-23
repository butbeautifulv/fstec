export const MEASURE_TAGS = [
  "network",
  "siem",
  "email",
  "av",
  "vulnerability",
  "organizational",
  "ioc",
] as const

export type MeasureTag = (typeof MEASURE_TAGS)[number]

const TAG_RULES: Array<{ tag: MeasureTag; re: RegExp }> = [
  { tag: "network", re: /сетев|ngfw|чёрн|белым списк|блокировк|ip-адрес/i },
  { tag: "siem", re: /мониторинг.*событий|корреляц|siem/i },
  { tag: "email", re: /почтов|вложен|домен отправител|электронн.*пис/i },
  { tag: "av", re: /антивирус|kaspersky|endpoint security/i },
  { tag: "vulnerability", re: /bdu:|уязвим|cvss|обновление программного обеспечения/i },
  {
    tag: "organizational",
    re: /утверд|многофактор|ответственн|реагирования на компьютерные инциденты/i,
  },
  { tag: "ioc", re: /^[a-f0-9]{64}$|^\d{1,3}\[\.\]/i },
]

export function tagMeasure(text: string, code: string | null = null): MeasureTag[] {
  const combined = `${code ?? ""} ${text}`
  const tags = new Set<MeasureTag>()
  for (const { tag, re } of TAG_RULES) {
    if (re.test(combined)) tags.add(tag)
  }
  if (tags.size === 0 && /^[a-f0-9]{32,64}$/i.test(text.trim())) {
    tags.add("ioc")
  }
  return [...tags]
}
