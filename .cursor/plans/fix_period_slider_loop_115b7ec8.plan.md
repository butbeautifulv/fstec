---
name: Fix period slider loop
overview: "Починить бесконечный цикл ползунков в слайдере периода дашборда: убрать конфликт двух источников `value`, синхронизировать URL с пресетом «Всё», защитить drag от `useEffect`, и отключить range-слайдер при одном дне данных."
todos:
  - id: fix-dual-value
    content: Убрать sliderIndices, единый sliderValue + periodIndices useMemo + isDraggingRef в dashboard-period-control.tsx
    status: completed
  - id: fix-period-all-url
    content: "periodSearchParams: писать period=all; тест round-trip в period-range.test.ts"
    status: completed
  - id: guard-commit-nav
    content: "commitSlider: skip router.replace если период не изменился"
    status: completed
  - id: single-day-ux
    content: Отключить range-слайдер при minDate === maxDate, показать статичную подпись
    status: completed
  - id: manual-verify-panel
    content: "Ручная проверка /panel: drag, пресеты, period=all, single-day"
    status: completed
isProject: false
---

# Починка слайдера периода дашборда

## Диагноз

Shadcn-слайдер уже используется — [`components/ui/slider.tsx`](components/ui/slider.tsx) (Radix `Slider.Root` + два `Thumb`). Менять компонент не нужно; баг в [`components/dashboard/dashboard-period-control.tsx`](components/dashboard/dashboard-period-control.tsx).

### Причина 1 — два источника `value` (главная)

```118:121:components/dashboard/dashboard-period-control.tsx
  const sliderIndices =
    period.preset === "all" && !period.from && !period.to
      ? ([0, totalDays] as [number, number])
      : sliderValue
```

При `?period=all`:
- `value={sliderIndices}` **каждый рендер** создаёт новый массив `[0, totalDays]` → Radix считает, что `value` изменился
- `onValueChange` пишет в `sliderValue`, но отображаемое значение остаётся `[0, totalDays]` из URL
- Ползунки «дёргаются» и уходят в бесконечный цикл обновлений

```mermaid
flowchart LR
  drag[onValueChange setSliderValue]
  render[render value=новый массив 0 totalDays]
  radix[Radix сбрасывает thumbs]
  drag --> render --> radix --> drag
```

### Причина 2 — пресет «Всё» не пишется в URL

[`periodSearchParams`](lib/dashboard/period-range.ts) явно **не** добавляет `period=all`:

```149:154:lib/dashboard/period-range.ts
export function periodSearchParams(period: PeriodRange): URLSearchParams {
  const params = new URLSearchParams()
  if (period.preset && period.preset !== "all") params.set("period", period.preset)
```

Клик «Всё» → `applyPeriod({ preset: "all" })` очищает URL → клиент снова парсит **дефолт 90d** → рассинхрон кнопок, `useEffect` и локального состояния.

### Причина 3 — degenerate range при одном дне

Если `minDate === maxDate` (часто после corpus seed: все `issuedAt` = `now()`):
- `totalDays = 1`, `value = [0, 0]`, `max = 1` — два thumb на почти нулевом диапазоне
- Любой drag → `commitSlider` → `router.push` с тем же периодом → повторная синхронизация → визуальный «баг ползунков»

## Решение

### 1. Единый источник truth для слайдера

В [`dashboard-period-control.tsx`](components/dashboard/dashboard-period-control.tsx):

- Удалить `sliderIndices`; всегда `value={sliderValue}`
- Вычислять целевые индексы из URL **один раз** через `useMemo`:

```ts
const periodIndices = useMemo((): [number, number] => {
  if (period.preset === "all" && !period.from && !period.to) return [0, totalDays]
  return clampSliderRange(period.from ?? minDate, period.to ?? maxDate, minDate, maxDate)
}, [period.preset, period.from, period.to, minDate, maxDate, totalDays])
```

- `useEffect` синхронизирует `sliderValue` ← `periodIndices` **только когда не тянем** (`isDraggingRef`)
- `onValueChange`: `isDraggingRef.current = true` + `setSliderValue`
- `onValueCommit`: `isDraggingRef.current = false` + `commitSlider` (с ранним выходом, если индексы не изменились)

### 2. Починить сериализацию `period=all`

В [`lib/dashboard/period-range.ts`](lib/dashboard/period-range.ts) — `periodSearchParams`:

```ts
if (period.preset === "all") {
  params.set("period", "all")
} else if (period.preset) {
  params.set("period", period.preset)
}
// from/to только если не preset all
```

Добавить тест round-trip: `periodSearchParams({ preset: "all" })` → parse → `{ preset: "all" }`.

### 3. Защита `commitSlider` от лишней навигации

В `commitSlider`:
- Сравнить новые `from`/`to` с текущим `period` (и preset)
- Если период не изменился — **не вызывать** `router.push` / `router.replace`
- Использовать `router.replace` вместо `push` для смены фильтра (без засорения history)

### 4. UX при одном дне данных

Когда `isSingleDay`:
- **Не рендерить** range-слайдер (или `disabled`)
- Показать статичную подпись: «Все поручения за {date}»
- Пресеты оставить (они всё равно меняют scope через bounds)

Это убирает бессмысленный dual-thumb на нулевом диапазоне.

### 5. Shadcn slider — без замены

Компонент [`components/ui/slider.tsx`](components/ui/slider.tsx) корректен для проекта. Опционально: `key={`${minDate}-${maxDate}`}` на `Slider` при смене bounds, чтобы сбросить внутреннее состояние Radix.

## Файлы

| Файл | Изменение |
|------|-----------|
| [`components/dashboard/dashboard-period-control.tsx`](components/dashboard/dashboard-period-control.tsx) | Единый `sliderValue`, `isDraggingRef`, guard в commit, disable при single-day |
| [`lib/dashboard/period-range.ts`](lib/dashboard/period-range.ts) | `periodSearchParams` пишет `period=all` |
| [`lib/dashboard/__tests__/period-range.test.ts`](lib/dashboard/__tests__/period-range.test.ts) | Тест round-trip для preset all + periodSearchParams |

## Проверка (DoD)

1. `/panel` без query: слайдер стабилен, ползунки не дёргаются
2. Клик «Всё» → URL `?period=all`, кнопка подсвечена, слайдер на полном диапазоне
3. Drag левого/правого thumb → плавно, без цикла; после отпускания URL обновляется `from`/`to`
4. При одном дне: нет range-слайдера, только подпись
5. `npm test -- lib/dashboard/__tests__/period-range.test.ts` проходит

## Не в scope

- Разброс `issuedAt` в corpus seed (улучшит демо, но не обязателен для фикса бага)
- Замена shadcn slider на другой компонент
