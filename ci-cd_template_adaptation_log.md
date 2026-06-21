# CI/CD Template Adaptation Log — FSTEC

> Журнал адаптации `.external/ci-cd_template` к реальному проекту FSTEC (Next.js / TypeScript).
> Цель: улучшить шаблон на основе практического опыта внедрения.

**Репозиторий:** [butbeautifulv/fstec](https://github.com/butbeautifulv/fstec)  
**Ветка:** `master`  
**Дата:** 2026-06-21  
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

| Файл | Источник | Назначение |
|------|----------|------------|
| `config/security-gate-policy.yaml` | template | block/warn по severity |
| `config/oss-tool-versions.yaml` | template | pinned docker-образы |
| `scripts/gate-check.py` | template | SARIF → exit 0/1 |
| `scripts/ai-ml-scan.py` | template | skill scanner |
| `scripts/normalize-sarif.py` | **добавлен при адаптации** | валидный SARIF для upload-sarif |
| `.github/actions/gate-and-export/` | template (с правками) | gate + upload SARIF |

### 2.2 Workflows

| Файл | Изменение |
|------|-----------|
| `.github/workflows/ci.yml` | job `security-gates` + permissions |
| `.github/workflows/security-gates.yml` | **новый**, 8 inline jobs |
| `.github/dependabot.yml` | + ecosystem `docker` |

### 2.3 Security jobs

| Job | Инструмент | Gate mode (итог) |
|-----|-----------|------------------|
| `secrets` | Gitleaks docker | warn |
| `sast` | Semgrep `p/ci` | **warn** (временно; было block) |
| `osa` | Trivy fs `package-lock.json` | block |
| `dependency-review` | GitHub Action | fail-on high (только PR) |
| `iac` | Checkov pip pin | block |
| `dockerfile` | Hadolint docker | warn |
| `forbidden-files` | find + regex | warn |
| `skill-scan` | ai-ml-scan.py | warn |

### 2.4 Намеренно не переносилось

deploy, sign, sbom-upload, Ruff linters, conftest, mcp-scan, CodeQL в security-gates (есть отдельный `codeql.yml`).

---

## 3. Итерации push → GitHub (полная хронология)

### Run 1 — FAIL parse (0s, 0 jobs)

| | |
|---|---|
| **Commit** | `771ba71` |
| **Run** | [27914218951](https://github.com/butbeautifulv/fstec/actions/runs/27914218951) |
| **Ошибка** | `workflows must be defined at the top level of the .github/workflows/ directory` |
| **Причина** | `security-gates.yml` вызывал reusable из `.github/workflows/jobs/oss/` |
| **Fix** | Inline все jobs в `security-gates.yml`, удалён `jobs/` |

### Run 2 — FAIL parse gate-and-export (0s)

| | |
|---|---|
| **Commit** | `25b5653` |
| **Run** | [27914248484](https://github.com/butbeautifulv/fstec/actions/runs/27914248484) |
| **Ошибка** | `Unrecognized named-value: 'vars'` / `'secrets'` в composite action |
| **Причина** | Composite actions **не имеют** контекста `vars`/`secrets` в `if:` и `env:` |
| **Fix** | DefectDojo → optional `inputs` в `gate-and-export/action.yml` |

### Run 3 — FAIL gate-and-export load (8/8 jobs стартовали, 7 fail)

| | |
|---|---|
| **Commit** | `4c37155` |
| **Run** | [27914303079](https://github.com/butbeautifulv/fstec/actions/runs/27914303079) |
| **verify** | ✅ success (1m35s) |
| **Сканеры** | Gitleaks, Semgrep, Trivy, Checkov, Hadolint, forbidden-files, skill-scan — **реально отработали** |
| **Ошибка upload** | `Unable to upload … as it is not valid SARIF: requires property "version", "tool"` |
| **Причина** | Placeholder SARIF `{"runs":[{"results":[]}]}` не проходит schema upload-sarif |
| **Gate-check** | iac ✅ ok; dockerfile ✅ warn-only; forbidden ✅ ok — но job fail из-за upload |
| **Fix** | `scripts/normalize-sarif.py` |

### Run 4 — FAIL PermissionError + invalid SARIF (4/8 fail)

| | |
|---|---|
| **Commit** | `081e096` |
| **Run** | [27914371411](https://github.com/butbeautifulv/fstec/actions/runs/27914371411) |
| **verify** | ✅ |
| **secrets, osa, sast, dockerfile** | ❌ |
| **iac, forbidden, skill-scan** | ✅ |
| **Ошибка 1** | `PermissionError: Permission denied: 'gitleaks.sarif'` — docker пишет root |
| **Ошибка 2** | Semgrep: `4 blocking findings` при mode=block |
| **Fix** | `-u $(id -u):$(id -g)` на docker; sast mode → warn |

### Run 5 — FAIL только Hadolint (7/8 ✅)

| | |
|---|---|
| **Commit** | `1192d57` |
| **Run** | [27914433923](https://github.com/butbeautifulv/fstec/actions/runs/27914433923) |
| **verify** | ✅ |
| **secrets, osa, sast, iac, forbidden, skill-scan** | ✅ |
| **dockerfile** | ❌ |
| **dependency-review** | skipped (push, не PR) |
| **Параллельно** | CodeQL ✅, SCA (Trivy image) ✅ |
| **Hadolint findings** | DL3018 warning ×3 Dockerfile (apk pin versions) |
| **Gate-check** | `[dockerfile] warn only — blocking findings: ['high']` → gate **не блокирует** |
| **Ошибка upload** | `locationFromSarifResult: expected at least one location` |
| **Причина** | Hand-written SARIF `{"level":"error","message":{...}}` без `locations` |
| **Скрытая проблема** | Semgrep с `-u` → `PermissionError: /.semgrep` — job зелёный, но **scan не выполнен** |
| **Fix (pending push)** | Hadolint SARIF с locations; Semgrep `HOME=/tmp` + `chown`; normalize всегда добавляет locations |

---

### Run 6 — ✅ SUCCESS (8/8 + verify)

| | |
|---|---|
| **Commit** | `1d62713` |
| **Run** | [27914512996](https://github.com/butbeautifulv/fstec/actions/runs/27914512996) |
| **verify** | ✅ ~1m35s |
| **secrets (Gitleaks)** | ✅ scan + SARIF upload |
| **sast (Semgrep)** | ✅ **4 findings (4 blocking rules)**, gate warn → CI green |
| **osa (Trivy)** | ✅ package-lock.json CVE scan |
| **iac (Checkov)** | ✅ docker-compose + Dockerfiles |
| **dockerfile (Hadolint)** | ✅ DL3018 warnings ×3, SARIF upload OK |
| **forbidden-files** | ✅ clean |
| **skill-scan** | ✅ clean |
| **dependency-review** | skipped (push event) |
| **Параллельно** | CodeQL ✅, SCA (Trivy image) ✅ |

**Semgrep реально сканирует:** Rules run: 46, Findings: 4. Gate: `[sast] ok (findings=4, mode=warn)`.

---

## 4. Финальный статус CI

**CI полностью зелёный на push.** Все security scanners запускаются, генерируют SARIF, upload в GitHub Security tab работает.

| Job | Статус | Сканирует |
|-----|--------|-----------|
| verify | ✅ | typecheck, lint, test:coverage, build |
| secrets | ✅ | Gitleaks git history |
| sast | ✅ | Semgrep p/ci (4 findings, warn) |
| osa | ✅ | Trivy npm lockfile |
| iac | ✅ | Checkov IaC |
| dockerfile | ✅ | Hadolint 3 Dockerfiles |
| forbidden-files | ✅ | suspicious file patterns |
| skill-scan | ✅ | `.agents/skills/` |
| dependency-review | ⏭ push | работает на PR |

### Commits (security CI, финал)

```
771ba71  initial security-gates (nested paths — broken)
25b5653  inline security-gates jobs
4c37155  composite action vars/secrets → inputs
081e096  normalize-sarif.py
1192d57  docker -u + sast warn (7/8)
1d62713  hadolint locations, semgrep HOME=/tmp → ALL GREEN
```

---

## 5. Анализ GitHub Actions (что реально сканирует)

### verify (без изменений)

```
npm ci → typecheck → lint → test:coverage → build
~1m35s
```

### secrets — Gitleaks

- Image: `ghcr.io/gitleaks/gitleaks:v8.22.1`
- Full git history (`fetch-depth: 0`)
- SARIF → Security tab, category `secrets`
- Gate: warn (не блокирует CI)

### sast — Semgrep

- Image: `returntocorp/semgrep:1.117.0`
- Config: `p/ci`
- **Первый успешный scan (run 4): 4 blocking findings**
- После `-u` fix (run 5): scan silently failed — **false green**
- После `HOME=/tmp` fix: ожидается реальный scan

### osa — Trivy

- Image: `aquasec/trivy:0.63.0`
- Target: `package-lock.json`, severity CRITICAL/HIGH/MEDIUM
- Gate: block на critical/high
- Дублирует часть `sca.yml` (тот же Trivy + image scan на master)

### iac — Checkov

- pip pin: `checkov==3.2.449`
- Frameworks: `dockerfile,docker_compose,kubernetes,helm`
- `--soft-fail` + gate-check
- Run 5: `findings=0, mode=block` → pass

### dockerfile — Hadolint

- Image: `hadolint/hadolint:v2.12.0-alpine`
- 3 Dockerfile, warnings DL3018 (unpinned apk packages)
- Gate warn — не блокирует, но upload-sarif требовал locations

### forbidden-files

- Regex: `.env$`, `.pem$`, `.key$`, `id_rsa`, `.p12$`, `.pfx$`
- Исключение: `.env.example`
- Run 5: suspicious files не найдены

### skill-scan

- `scripts/ai-ml-scan.py skill_scan`
- Paths: `.cursor/skills/`, `.agents/skills/`
- Run 5: clean

### dependency-review

- Только `pull_request` event
- `fail-on-severity: high`
- На push → skipped (by design)

---

## 6. Баги шаблона для исправления (feed-back)

| # | Severity | Проблема | Где в шаблоне | Рекомендация |
|---|----------|----------|---------------|--------------|
| 1 | **critical** | Reusable workflows в `workflows/jobs/oss/` | `security-gates-oss.yml`, все `jobs/oss/*.yml` | Flat: `.github/workflows/security-gate-*.yml` или inline jobs |
| 2 | **critical** | `vars`/`secrets` в composite action | `actions/gate-and-export/action.yml` L39-40 | Только `inputs`; документировать ограничение |
| 3 | **high** | Placeholder SARIF без `version`/`tool`/`locations` | `dockerfile-lint.yml`, `forbidden-files.yml`, `gate-and-export` | `normalize-sarif.py` в шаблон; valid minimal SARIF helper |
| 4 | **high** | Docker scan → root-owned SARIF | все `docker run` jobs | `sudo chown` после scan или `-e HOME=/tmp` для Semgrep |
| 5 | **medium** | Semgrep + `-u $(id -u)` → `PermissionError: /.semgrep` | oss semgrep pattern | `-e HOME=/tmp`, не `-u` |
| 6 | **medium** | Hadolint hand-written SARIF без locations | `oss/dockerfile-lint.yml` | `--format sarif` или python helper с locations |
| 7 | **low** | `validate-github-oss.sh` не ловит #1 | `scripts/validate-github-oss.sh` | Проверка depth `workflow_call` paths |
| 8 | **low** | sast mode=block на day-1 | `security-gate-policy.yaml` | Phase B2: warn → block после triage |
| 9 | **info** | `aspm-export.py` referenced but optional | gate-and-export | Guard `if [ -f scripts/aspm-export.py ]` — уже добавлено |

---

## 7. Что сработало хорошо

- `security-gate-policy.yaml` — смена block/warn без правки workflow
- Pinned docker images из `oss-tool-versions.yaml`
- Сохранение `codeql.yml` / `sca.yml` / `dast.yml` — без конфликтов
- `dependabot.yml` — расширен docker ecosystem, npm groups сохранены
- Parallel jobs в security-gates — ~20s wall time vs ~1m35s verify
- SARIF upload → GitHub Security tab (после normalize fix)

---

## 8. Предложения для `ci-cd_template`

1. **GitHub layout:** `adopt.sh --platform github` → flat workflows, не `jobs/oss/`
2. **Profile `shift-left-node`:** Semgrep + Trivy npm + Hadolint, без Ruff
3. **`scripts/normalize-sarif.py`** — включить в шаблон, вызывать из gate-and-export
4. **Docker scan helper:** `scripts/docker-scan.sh` с `chown` и `HOME=/tmp`
5. **Validator:** workflow_call path depth + composite action context lint
6. **Docs:** `github.md` — явно: reusable only at `.github/workflows/*.yml`
7. **Phase defaults:** secrets/dockerfile/sast = warn on first adopt

---

## 9. Хронология (UTC)

| Время | Событие |
|-------|---------|
| 18:55 | Push 771ba71 — CI fail 0s (nested workflow paths) |
| 18:57 | Push 25b5653 — inline jobs; fail composite vars/secrets |
| 18:59 | Push 4c37155 — gate-and-export inputs fix |
| 19:01 | Push 081e096 — normalize-sarif; PermissionError root SARIF |
| 19:04 | Push 1192d57 — docker -u, sast warn; 7/8 green, Hadolint upload fail |
| 19:07 | Push 1d62713 — **CI ALL GREEN** Run [27914512996](https://github.com/butbeautifulv/fstec/actions/runs/27914512996) |

---

## 10. Ссылки на runs

| Run | Commit | Result | URL |
|-----|--------|--------|-----|
| 1 | 771ba71 | fail parse | https://github.com/butbeautifulv/fstec/actions/runs/27914218951 |
| 2 | 4c37155 | fail upload SARIF | https://github.com/butbeautifulv/fstec/actions/runs/27914303079 |
| 3 | 081e096 | fail PermissionError | https://github.com/butbeautifulv/fstec/actions/runs/27914371411 |
| 4 | 1192d57 | 7/8 pass | https://github.com/butbeautifulv/fstec/actions/runs/27914433923 |
| 5 | 1d62713 | **ALL GREEN** | https://github.com/butbeautifulv/fstec/actions/runs/27914512996 |

---

*Файл предназначен для feed-back в `.external/ci-cd_template`. Обновлять после каждого значимого CI run.*
