# CI/CD Template Adaptation Log — FSTEC

> Журнал адаптации `.external/ci-cd_template` к реальному проекту FSTEC (Next.js / TypeScript).
> Цель: улучшить шаблон на основе практического опыта внедрения.

**Репозиторий:** `butbeautifulv/fstec`  
**Ветка:** `master`  
**Дата начала:** 2026-06-21  
**Профиль шаблона:** shift-left / oss-full (CI-only, без deploy)

---

## 1. Контекст проекта

| Параметр | Значение |
|----------|----------|
| Стек | Next.js 15, TypeScript, Prisma, npm |
| CI до адаптации | `ci.yml` (typecheck, lint, test:coverage, build) |
| Security до адаптации | `codeql.yml`, `sca.yml` (Trivy), `dast.yml` (ZAP, schedule) |
| Dockerfile | `Dockerfile`, `docker/nginx/Dockerfile`, `docker/pgbouncer/Dockerfile` |
| IaC | `docker-compose*.yml` (4 файла) |
| Agent skills | `.agents/skills/**` |

---

## 2. Что было скопировано из шаблона

### 2.1 Инфраструктура gate

| Файл | Источник в шаблоне | Назначение |
|------|-------------------|------------|
| `config/security-gate-policy.yaml` | `config/security-gate-policy.yaml` | block/warn по severity для каждого контроля |
| `config/oss-tool-versions.yaml` | `config/oss-tool-versions.yaml` | pinned версии docker-образов сканеров |
| `scripts/gate-check.py` | `scripts/gate-check.py` | парсинг SARIF → exit 0/1 по политике |
| `scripts/ai-ml-scan.py` | `scripts/ai-ml-scan.py` | skill scanner для `.agents/skills/` |
| `.github/actions/gate-and-export/action.yml` | `templates/github/actions/gate-and-export/` | ensure report → gate-check → upload SARIF |

### 2.2 Workflows

| Файл | Изменение |
|------|-----------|
| `.github/workflows/ci.yml` | добавлен job `security-gates` (reusable), permissions |
| `.github/workflows/security-gates.yml` | **новый** — оркестратор 8 security jobs |
| `.github/dependabot.yml` | добавлена экосystem `docker` (npm/actions сохранены) |

### 2.3 Security jobs (из `templates/github/workflows/jobs/oss/`)

| Job | Инструмент | Политика (mode) |
|-----|-----------|-----------------|
| `secrets` | Gitleaks docker | warn |
| `sast` | Semgrep `p/ci` | block (critical/high) |
| `osa` | Trivy fs `package-lock.json` | block (critical/high) |
| `dependency-review` | GitHub Action | fail-on high (PR only) |
| `iac` | Checkov pip pin | block (critical/high) |
| `dockerfile` | Hadolint docker | warn |
| `forbidden-files` | find + regex | warn (via linters control) |
| `skill-scan` | ai-ml-scan.py | warn |

### 2.4 Что намеренно НЕ переносилось

- deploy-preprod, build-push, sign, sbom-upload — по запросу «только CI»
- Ruff linter-security — проект TypeScript/ESLint, не Python
- conftest admission — нет Helm/K8s deploy pipeline
- mcp-scan — нет `mcp.json` в репо
- CodeQL в security-gates — уже есть отдельный `codeql.yml` на master

---

## 3. Первая попытка push — FAIL (критический баг шаблона)

### 3.1 Симптом

```
Push: 771ba71 (feat: observability stack — включал security-gates)
Run:  https://github.com/butbeautifulv/fstec/actions/runs/27914218951
Duration: 0s, jobs: 0
```

Annotation:
```
Invalid workflow file: .github/workflows/ci.yml#L37
error parsing called workflow ".github/workflows/ci.yml"
  -> "./.github/workflows/security-gates.yml"
  : invalid value workflow reference:
    workflows must be defined at the top level of the .github/workflows/ directory
```

### 3.2 Корневая причина

Шаблон кладёт reusable workflows в **подкаталоги**:

```
templates/github/workflows/jobs/oss/gitleaks.yml   ← workflow_call
templates/github/workflows/jobs/oss/semgrep-sast.yml
...
templates/github/workflows/security-gates-oss.yml  ← uses: ./.github/workflows/jobs/oss/*.yml
```

**GitHub Actions не поддерживает reusable workflows (`on: workflow_call`) вне `.github/workflows/` верхнего уровня.**

`security-gates.yml` вызывал 8 nested reusable из `jobs/oss/` — CI падал ещё на этапе парсинга, до запуска любого job.

### 3.3 Рекомендация для шаблона

1. **Вариант A (простой):** все security jobs inline в одном `security-gates.yml` (без nested `workflow_call`).
2. **Вариант B (модульный):** каждый job — отдельный файл **только** в `.github/workflows/`:
   - `security-gate-gitleaks.yml`
   - `security-gate-semgrep.yml`
   - …
3. Добавить в `scripts/validate-github-oss.sh` проверку: любой файл с `workflow_call` должен лежать не глубже `.github/workflows/*.yml`.
4. Обновить `docs/platforms/github.md` — явно указать ограничение GitHub.

### 3.4 Fix в FSTEC

Все 8 jobs **встроены inline** в `.github/workflows/security-gates.yml`.  
Каталог `.github/workflows/jobs/` удалён.

---

## 4. Вторая попытка push — (заполняется после push)

<!-- RUN_RESULTS -->

---

## 5. Анализ результатов GitHub Actions

<!-- GITHUB_ANALYSIS -->

---

## 6. Выводы для улучшения шаблона

### 6.1 Подтверждённые проблемы

| # | Проблема | Severity | Статус в FSTEC |
|---|----------|----------|----------------|
| 1 | Reusable workflows в `jobs/oss/` — GitHub reject | **critical** | fixed: inline jobs |
| 2 | | | |

### 6.2 Что сработало хорошо

- Политика `security-gate-policy.yaml` — гибкий block/warn без правки YAML
- Pinned docker images из `oss-tool-versions.yaml`
- Сохранение существующих `codeql.yml` / `sca.yml` / `dast.yml` без конфликтов
- `dependabot.yml` — расширение, а не замена

### 6.3 Предложения для `ci-cd_template`

1. Переструктурировать `templates/github/workflows/jobs/` → flat `.github/workflows/security-gate-*.yml`
2. Добавить profile `shift-left-node` без Ruff, с Semgrep + npm Trivy
3. В `adopt.sh` — автоматический flat layout для GitHub
4. Validator: `workflow_call` path depth check
5. Документировать что `dependency-review` работает только на `pull_request`

---

## 7. Хронология

| Время (UTC) | Событие |
|-------------|---------|
| 2026-06-21 ~18:55 | Push 771ba71 — CI fail 0s (nested workflow paths) |
| 2026-06-21 | Fix: inline jobs в security-gates.yml |
| | Push fix + мониторинг runs — см. §4–5 |
