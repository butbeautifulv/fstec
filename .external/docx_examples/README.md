# Локальный корпус DOCX (не коммитить)

Файлы `.docx` и папка `corpus/` **игнорируются git** — они не должны попадать на GitHub.

## Вариант 1: полный архив

Положите распакованный корпус сюда:

```
.external/240 93 6837/
  240 93 6837/
    240 93 6837.docx
    ...
```

## Вариант 2: нарезка для dev

Из корня репозитория:

```bash
npm run corpus:prepare-slice
```

Скопирует несколько писем в `.external/docx_examples/corpus/` (тоже в gitignore).

## Сид для теста routing

```bash
make dev-infra
npm run db:boot:corpus
```

Проверка, что docx не отслеживается git:

```bash
git check-ignore -v .external/docx_examples/corpus/
```
