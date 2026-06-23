---
name: DOCX parser corpus plan
overview: "DOCX-only: парсер по корпусу, регрессия, маршрутизация мер. Каждая миниподфаза — один маленький diff (1–3 файла). Excel в продукте — xlsx_report_forms.plan.md (deferred)."
todos:
  - id: p43-01
    content: 43.1 scripts/audit-docx-corpus.mjs — скан + JSON summary (новый файл)
    status: completed
  - id: p43-02
    content: "43.2 audit: pattern tag nested|bdu_flat|flat|routing|zero в том же скрипте"
    status: completed
  - id: p43-03
    content: 43.3 scripts/extract-labels-dataset.mjs — offline jsonl из Отчет*.xlsx
    status: completed
  - id: p43-04
    content: 43.4 .gitignore labels-dataset.jsonl + npm script corpus:audit
    status: completed
  - id: p43-05
    content: 43.5 Скопировать 5 fixtures (4164,4165,6837,1409-apdx,2386) в docx_examples/corpus/
    status: completed
  - id: p43-06
    content: 43.6 Добрать fixtures до 12–15 по audit-report (ещё 7 файлов)
    status: completed
  - id: p44-01
    content: 44.1 classifyAppendixKind() в parse-docx.ts — только функция + unit-тесты
    status: completed
  - id: p44-02
    content: 44.2 detectImportKind делегирует classifyAppendixKind; isAppendixDocument deprecated path
    status: completed
  - id: p44-03
    content: "44.3 parse-docx.test: RECOMMENDATIONS 1409 appendix → 38 codes (fixture)"
    status: completed
  - id: p44-04
    content: 44.4 index.ts parseMeasureImport — RECOMMENDATIONS → parseMeasureItemsFromParagraphs
    status: completed
  - id: p44-05
    content: 44.5 index.test.ts — RECOMMENDATIONS appendix mock → N items не 1
    status: completed
  - id: p45-01
    content: 45.1 COMPOSITE_ACTION_RE + isBoilerplateParagraph() — константы, тесты без pipeline
    status: completed
  - id: p45-02
    content: 45.2 stripThreatPreamble(paragraphs[]) — отсечь «Хакерскими группировками…»
    status: completed
  - id: p45-03
    content: 45.3 splitCompositeBlock(block) — разрез по маркерам, unit-тест на блоке 2 из 6837
    status: completed
  - id: p45-04
    content: 45.4 expandCompositeBlocks() в pipeline после groupNumberedBlocks
    status: completed
  - id: p45-05
    content: 45.5 Коды sub-блоков 2.1,2.2… + fixture test 240 93 6837.docx
    status: completed
  - id: p45-06
    content: 45.6 Регрессия 4164/4165 — count codes без изменений
    status: completed
  - id: p46-01
    content: 46.1 parseBduInlineMeasures() — BDU + буллеты (2386), отдельный файл или секция
    status: completed
  - id: p46-02
    content: 46.2 parseImperativeListMeasures() — глаголы после «рекомендуется» (1423)
    status: completed
  - id: p46-03
    content: 46.3 parseUnnumberedMeasures() orchestrator + fallback в parseMeasureItemsFromParagraphs
    status: completed
  - id: p46-04
    content: 46.4 Fixture tests 2386 + 1423; numbered letters unchanged
    status: completed
  - id: p47-01
    content: "47.1 extractMetadata: needsAppendix boolean если 0 мер + «Приложение:» в тексте"
    status: completed
  - id: p47-02
    content: 47.2 Prisma MeasureImport.needsAppendix? или metadata Json — миграция минимальная
    status: completed
  - id: p47-03
    content: "47.3 API/UI: баннер «загрузите приложение» на import detail если needsAppendix"
    status: completed
  - id: p47-04
    content: 47.4 suggestAppendixParent() — match по documentNumber при upload child
    status: completed
  - id: p47-05
    content: 47.5 parse-docx.test.ts — corpus/ fixtures describe.skipIf batch
    status: completed
  - id: p47-06
    content: 47.6 mail-inbox/fetch.ts — пара letter+приложение в одном проходе (если есть)
    status: completed
  - id: p48-01
    content: 48.1 extractDocxTablesAsync() — w:tbl → string[][] (новый файл)
    status: completed
  - id: p48-02
    content: 48.2 table rows → pseudo-paragraphs merge в extract (только если audit table-only >0)
    status: completed
  - id: p49-01
    content: 49.1 tag-measure.ts — tagMeasure(text,code) pure + unit tests
    status: completed
  - id: p49-02
    content: 49.2 Prisma MeasureImportItem.tags String[] — migrate + generate
    status: completed
  - id: p49-03
    content: 49.3 parseMeasureImport — записать tags при create items
    status: completed
  - id: p49-04
    content: 49.4 API GET import items — отдать tags в JSON
    status: completed
  - id: p49-05
    content: 49.5 measure-import-detail-client — колонка/бейджи тегов (только UI)
    status: completed
  - id: p50-01
    content: 50.1 scripts/build-routing-profiles.mjs — json из labels-dataset
    status: completed
  - id: p50-02
    content: 50.2 routing-profiles.ts — статический fallback ДЦОД/network, ДИТСБ/siem
    status: completed
  - id: p50-03
    content: 50.3 suggest-routing.ts — score tags×profile, pure function + tests
    status: completed
  - id: p50-04
    content: 50.4 GET /api/measure-imports/[id]/routing-suggestions route
    status: completed
  - id: p50-05
    content: "50.5 Тест 6837: network-меры → ДЦОД в top-1"
    status: completed
  - id: p51-01
    content: 51.1 validations/orders — targets[].measureIds optional; schema only
    status: completed
  - id: p51-02
    content: 51.2 batch-create.ts — per-target measureIds, fallback global list
    status: completed
  - id: p51-03
    content: 51.3 batch-create.test.ts — разные measureIds на targets
    status: completed
  - id: p51-04
    content: 51.4 order-create-client — fetch routing-suggestions при import
    status: completed
  - id: p51-05
    content: 51.5 UI матрица меры×подразделения (чекбоксы, accept all)
    status: completed
  - id: p51-06
    content: 51.6 scripts/train-routing-model.py — offline CatBoost (опционально)
    status: completed
  - id: p51-07
    content: 51.7 routing-model.ts inference hook — только если модель есть на диске
    status: completed
isProject: false
---

# План: DOCX-парсер и маршрутизация (миниподфазы)

**Принцип:** одна миниподфаза = один PR, **1–3 файла**, тесты рядом с логикой. Не смешивать parser + UI + prisma в одном diff.

**Скоуп:** DOCX + routing. Excel в продукте — [xlsx_report_forms.plan.md](./xlsx_report_forms.plan.md) (deferred).

---

## Карта миниподфаз

```mermaid
flowchart LR
  subgraph audit [43 audit]
    p43_01[43.1 script]
    p43_03[43.3 labels]
    p43_05[43.5 fixtures]
  end
  subgraph parse [44-48 parse]
    p44[44 appendix]
    p45[45 composite]
    p46[46 unnumbered]
    p47[47 link]
    p48[48 tables]
  end
  subgraph route [49-51 routing]
    p49[49 tags]
    p50[50 rules]
    p51[51 UI+ML]
  end
  audit --> parse --> route
```

---

## 43 — Аудит корпуса (6 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **43.1** | Скелет audit-скрипта | `scripts/audit-docx-corpus.mjs` |
| **43.2** | Pattern classification в скрипте | тот же файл |
| **43.3** | Labels extractor offline | `scripts/extract-labels-dataset.mjs` |
| **43.4** | Wiring | `.gitignore`, `package.json` script `corpus:audit` |
| **43.5** | Первые 5 fixtures | `.external/docx_examples/corpus/*` |
| **43.6** | Остальные fixtures по audit | копирование файлов |

**DoD блока 43:** `npm run corpus:audit` → summary JSON; 12–15 fixtures; `labels-dataset.jsonl` локально.

---

## 44 — Appendix kind (5 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **44.1** | `classifyAppendixKind()` pure | `parse-docx.ts`, `parse-docx.test.ts` |
| **44.2** | Подключить в `detectImportKind` | `parse-docx.ts` |
| **44.3** | Fixture 1409 appendix 38 мер | `parse-docx.test.ts`, corpus file |
| **44.4** | Import pipeline RECOMMENDATIONS | `index.ts` |
| **44.5** | Mock test import | `index.test.ts` |

**Не трогать:** Prisma enum в 44 — kind остаётся `APPENDIX`/`LETTER` в БД; различие только в parse-ветке (меньше миграций).

---

## 45 — Composite 6837 (6 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **45.1** | Regex + boilerplate helper | `parse-docx.ts` или `parse-composite.ts`, tests |
| **45.2** | `stripThreatPreamble` | +tests isolated |
| **45.3** | `splitCompositeBlock` unit test на raw block | +tests |
| **45.4** | `expandCompositeBlocks` в pipeline | `parse-docx.ts` |
| **45.5** | Fixture 6837 + коды `2.1`… | `parse-docx.test.ts`, corpus |
| **45.6** | Regression 4164/4165 counts | `parse-docx.test.ts` only |

**Порядок:** 45.1→45.3 без изменения публичного API; 45.4 одна строчка в pipeline.

---

## 46 — Unnumbered (4 миниподфазы)

| ID | Diff | Файлы |
|----|------|-------|
| **46.1** | BDU-inline parser | `parse-unnumbered.ts` (новый, маленький) |
| **46.2** | Imperative list parser | тот же файл |
| **46.3** | Orchestrator + hook | `parse-docx.ts` (3–5 строк) |
| **46.4** | Fixtures 2386, 1423 | tests + corpus |

---

## 47 — Letter↔appendix + regression (6 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **47.1** | `needsAppendix` в metadata extract | `extract-metadata.ts`, test |
| **47.2** | Поле в БД | `prisma/schema.prisma`, migrate |
| **47.3** | UI баннер | `measure-import-detail-client.tsx` |
| **47.4** | Auto parent на child upload | `createMeasureImportUpload` / API route |
| **47.5** | Corpus test suite | `parse-docx.test.ts` |
| **47.6** | Mail-inbox pairing | `lib/mail-inbox/fetch.ts` (опционально) |

---

## 48 — Таблицы DOCX (2 миниподфазы, conditional)

| ID | Diff | Файлы |
|----|------|-------|
| **48.1** | Table walker | `parse-docx-tables.ts` |
| **48.2** | Merge в extract (feature flag / if zero numbered) | `parse-docx.ts` |

**Skip 48.*** если audit 43.2 показывает `<3` table-only писем.

---

## 49 — Теги мер (5 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **49.1** | Pure tagger + tests | `tag-measure.ts`, `tag-measure.test.ts` |
| **49.2** | Prisma `tags` | schema + migrate |
| **49.3** | Write tags on parse | `index.ts` |
| **49.4** | API expose tags | route handler или existing GET |
| **49.5** | Preview UI badges | client component only |

---

## 50 — Rule routing (5 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **50.1** | Build profiles script | `scripts/build-routing-profiles.mjs` |
| **50.2** | Static profiles config | `routing-profiles.ts` |
| **50.3** | `suggestRouting()` pure | `suggest-routing.ts`, tests |
| **50.4** | API route | `app/api/measure-imports/[id]/routing-suggestions/route.ts` |
| **50.5** | Integration test 6837 | test file |

**MVP routing:** остановиться на 50.5 без 51.6–51.7.

---

## 51 — Per-subdivision batch + ML optional (7 миниподфаз)

| ID | Diff | Файлы |
|----|------|-------|
| **51.1** | Zod schema | `validations/orders.ts` |
| **51.2** | Batch create logic | `batch-create.ts` |
| **51.3** | Unit tests | `batch-create.test.ts` |
| **51.4** | Fetch suggestions in wizard | `order-create-client.tsx` |
| **51.5** | Matrix UI | component extract if diff большой |
| **51.6** | Train script offline | `scripts/train-routing-model.py` |
| **51.7** | Optional inference | `routing-model.ts` |

**51.1–51.5** не зависят от CatBoost. **51.6–51.7** только если 50.5 precision недостаточен.

---

## Рекомендуемые PR-цепочки

| PR | Миниподфазы | ~файлов |
|----|-------------|---------|
| corpus-tooling | 43.1–43.4 | 3 |
| corpus-fixtures | 43.5–43.6 | fixtures only |
| appendix-detect | 44.1–44.3 | 2 |
| appendix-import | 44.4–44.5 | 2 |
| composite-helpers | 45.1–45.3 | 2 |
| composite-pipeline | 45.4–45.6 | 2 |
| unnumbered | 46.1–46.4 | 3 |
| needs-appendix | 47.1–47.3 | 4 |
| appendix-link | 47.4–47.6 | 3 |
| tags-core | 49.1–49.3 | 4 |
| tags-ui | 49.4–49.5 | 2 |
| routing-rules | 50.1–50.5 | 5 |
| batch-per-sub | 51.1–51.5 | 5 |
| routing-ml | 51.6–51.7 | 2 |

---

## Вне скоупа

| Тема | План |
|------|------|
| XLSX в продукте | [xlsx_report_forms.plan.md](./xlsx_report_forms.plan.md) |
| SLA / mark.md | workflow |
| ФИО из «С ответственными» | нет данных |

---

## Риски (без изменений)

- Routing (49–51) только после стабильных текстов мер (44–46)
- Labels шумные — чистка в 43.3
- CatBoost опционален; rules fallback всегда
