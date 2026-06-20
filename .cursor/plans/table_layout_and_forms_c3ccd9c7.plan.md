---
name: Table layout and forms
overview: Унифицировать ширины и сортировку колонок DataTable (включая даты), добавить кликабельные названия в мерах/поручениях, убрать лишний border у action-блоков форм, заменить MeasurePicker на inline-таблицу.
todos:
  - id: column-layout-core
    content: Add column-layout.ts + sort-helpers.ts; extend ColumnMeta; apply layout classes in data-table.tsx (table-fixed)
    status: in_progress
  - id: wire-tables-layout-sort
    content: Apply layout + DataTableColumnHeader + date/number sort to all DataTable column defs
    status: pending
  - id: clickable-names
    content: Add Link on measure name and order title cells
    status: pending
  - id: form-actions-bar
    content: Create FormActionsBar; replace empty Card+CardFooter in measure/order/org forms
    status: pending
  - id: measure-picker-table
    content: Rewrite MeasurePicker as inline checkbox table; full-width measures card in order create
    status: pending
  - id: verify
    content: typecheck, lint, build
    status: pending
isProject: false
---

# Table layout standard + sort + form fixes

## Проблемы

| Жалоба | Причина в коде |
|--------|----------------|
| Нет сортировки по датам | Колонки `dueAt` / `issuedAt` / `createdAt` — plain `header: "Срок"`, без [`DataTableColumnHeader`](components/data-table/data-table-column-header.tsx); UI сортировки не рендерится |
| «Пляшут» колонки между вкладками | [`Table`](components/ui/table.tsx) — `w-full` без `table-fixed`; `TableHead`/`TableCell` — `whitespace-nowrap`; нет общих width-токенов между [`measures-table`](components/admin/measures-table.tsx), [`orders-table`](components/admin/orders-table.tsx), [`organizations-manager`](components/admin/organizations-manager.tsx), matrix и т.д. |
| Нельзя кликнуть название меры/поручения | В org — [`Link`](components/admin/organizations-manager.tsx) в cell name; в measures/orders — plain text |
| Странный border над «Отмена / Сохранить» | Пустой [`Card`](components/ui/card.tsx) + [`CardFooter`](components/ui/card.tsx) с дефолтным `border-t bg-muted/50` ([`measure-form.tsx`](components/admin/measure-form.tsx), [`order-create-form.tsx`](components/admin/order-create-form.tsx), [`organization-form.tsx`](components/admin/organization-form.tsx)) |
| MeasurePicker — лишний dropdown | [`measure-picker.tsx`](components/admin/measure-picker.tsx) — Popover+Command внутри Card «Меры», хотя блок уже отдельный |

---

## 1. Общий стандарт колонок

Новый [`lib/data-table/column-layout.ts`](lib/data-table/column-layout.ts):

```ts
export const COLUMN_LAYOUT = {
  actions: "w-[1%] whitespace-nowrap",
  date: "w-28 tabular-nums whitespace-nowrap",
  code: "w-24 font-mono",
  count: "w-16 tabular-nums text-center",
  status: "w-36",
  org: "w-[18%] min-w-[8rem] whitespace-normal break-words",
  title: "w-[22%] min-w-[10rem] whitespace-normal break-words",  // name / order title
  measure: "w-[24%] min-w-[10rem] whitespace-normal break-words",
  subdivisions: "w-[20%] min-w-[8rem] whitespace-normal break-words",
} as const
```

Хелпер `withColumnLayout(type, extraMeta?)` → дополняет `meta.layoutClass`.

Расширить `ColumnMeta` в [`faceted-column.ts`](lib/data-table/faceted-column.ts): `layoutClass?: string`.

### [`data-table.tsx`](components/data-table/data-table.tsx)

- `<Table className="table-fixed">` — фиксированная сетка, одинаковые пропорции на всех страницах
- В `TableHead` / `TableCell` — `cn(meta?.layoutClass)` + для text-колонок override `whitespace-normal break-words` (перебивает дефолт `whitespace-nowrap` из [`table.tsx`](components/ui/table.tsx))

---

## 2. Сортировка дат (и прочих колонок)

Новый [`lib/data-table/sort-helpers.ts`](lib/data-table/sort-helpers.ts):

```ts
export const dateSortFn: SortingFn<unknown> = (a, b, columnId) =>
  new Date(a.getValue(columnId) as string).getTime() -
  new Date(b.getValue(columnId) as string).getTime()

export const numberSortFn: SortingFn<unknown> = ...
```

**Правило:** любая сортируемая колонка использует `DataTableColumnHeader` + `enableSorting: true` (default). Для дат/чисел — `sortingFn: dateSortFn` / `numberSortFn`.

### Таблицы — добавить sort header + layout на даты

| Файл | Колонки |
|------|---------|
| [`measures-table.tsx`](components/admin/measures-table.tsx) | name, code, createdAt |
| [`orders-table.tsx`](components/admin/orders-table.tsx) | title, items count, issuedAt |
| [`organizations-manager.tsx`](components/admin/organizations-manager.tsx) | name, shortCode (+ layout на все) |
| [`admin-dashboard-matrix.tsx`](components/admin/admin-dashboard-matrix.tsx) | measure, dueAt (+ layout на все) |
| [`order-detail-client.tsx`](components/admin/order-detail-client.tsx) | measure, dueAt |
| [`public-measures-table.tsx`](components/public/public-measures-table.tsx) | dueAt (+ layout) |

---

## 3. Кликабельные названия

| Таблица | Cell | Href |
|---------|------|------|
| Measures | name | `/panel/measures/{id}/edit` |
| Orders | title | `/panel/orders/{id}` |

Стиль как у org: `font-medium hover:underline`. Колонка title/name — `COLUMN_LAYOUT.title`.

---

## 4. Form actions — убрать пустой Card + border

Новый [`components/admin/form-actions-bar.tsx`](components/admin/form-actions-bar.tsx):

```tsx
// flex row, без Card/CardFooter — только кнопки + FormErrorSlot
export function FormActionsBar({ error, children }: ...)
```

Заменить блок:

```tsx
<Card><CardFooter>...</CardFooter></Card>
```

на `<FormActionsBar>` в:
- [`measure-form.tsx`](components/admin/measure-form.tsx)
- [`order-create-form.tsx`](components/admin/order-create-form.tsx)
- [`organization-form.tsx`](components/admin/organization-form.tsx)

---

## 5. MeasurePicker → inline-таблица

Переписать [`measure-picker.tsx`](components/admin/measure-picker.tsx):

```
┌─ Поиск ─────────────────────────────┐
│ [Select all] [Clear]  Выбрано: N    │
├────┬──────────────────────┬────────┤
│ ☐  │ Название меры        │ Код    │
│ ☐  │ ...                  │ ...    │
└────┴──────────────────────┴────────┘
  ScrollArea max-h-72, bordered
```

- Убрать Popover / combobox trigger
- Checkbox-строки в shadcn `Table`
- Локальный search filter по name/code
- Без вложенного `FieldLabel` «Меры» (заголовок уже в Card)

В [`order-create-form.tsx`](components/admin/order-create-form.tsx):
- Card «Меры» — **full width** (`lg:col-span-2`), т.к. таблица требует горизонтального места
- Grid: параметры поручения (1 col) + меры (full width row ниже) **или** меры на всю ширину под двумя колонками

---

## DoD

- Все admin/public DataTable с датами — кликабельная сортировка asc/desc в header
- Переключение вкладок Организации / Поручения / Меры / Сводка — колонки одного типа на одной «сетке» (date ≈ 7rem, org ≈ 18%, title ≈ 22%, long text с переносом)
- Measures name → edit, Orders title → detail
- Формы create/edit — action bar без верхней полоски border
- Создание поручения — выбор мер inline-таблицей, без dropdown
- `npm run typecheck && lint && build`
