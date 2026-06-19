<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FSTEC Agent Rules

## Architecture (do not break)

Three contexts — shared logic in `lib/` only:

| Context | Path | Notes |
|---------|------|-------|
| `public` | `app/(public)/` | Token-based assignment pages (`/p/[token]`) |
| `admin` | `app/(admin)/admin/(panel)/` | Admin panel (session required) |
| `api` | `app/api/` | Route Handlers |
| `lib` | `lib/` | Domain: `measures`, `orders`, `organizations`, `public`, `auth`, `db` |

- Public pages call `/api/public/[token]` only (scoped by token).
- Admin pages call `/api/*` with session cookie.
- No secrets in git; read `.env.example`.

## UI (shadcn required)

- Use [.agents/skills/shadcn/SKILL.md](.agents/skills/shadcn/SKILL.md) for all UI work.
- Add components via `npx shadcn@latest add <component> -y` — do not hand-roll if registry has it.
- Forms: `FieldGroup` + `Field`; dropdowns: `Select`; notifications: `sonner`.
- Admin layout: shadcn `Sidebar`.

## Verify before finishing

```bash
npm run typecheck
npm run lint
npm run build
```

Plus smokes from phase plan (curl admin API, open `/p/{token}`).

## Multi-phase work

1. Master plan: `docs/plans/fstec_master.plan.md`
2. Phase plan in `docs/plans/`
3. Branch: `fstec/phase-NN-slug`
4. Implement → PR → critic → merge → update master plan

## Agent rules (`.agents/rules/`)

| Rule | Purpose |
|------|---------|
| `fstec-agent-workflow.mdc` | End-of-task workflow, architecture |
| `fstec-agent-critic.mdc` | PR review gate |
| `fstec-agent-subagents.mdc` | Parallel implementer spawning |
| `fstec-agent-kaizen.mdc` | Error metacognition |
| `fstec-agent-documentation.mdc` | Docs sync after merge |
| `fstec-agent-parallel-branches.mdc` | Branch naming & merge |
| `fstec-agent-security.mdc` | Security checklist |
| `fstec-karpathy-guidelines.mdc` | Behavioral guidelines |

## Skills

- Next.js: `.agents/skills/next-best-practices/`
- shadcn/ui: `.agents/skills/shadcn/`
- Workflow: `.agents/skills/fstec-karpathy-guidelines/`
