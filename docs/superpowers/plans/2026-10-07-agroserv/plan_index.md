# AgroServ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the minimal AgroServ web app (homepage, two public pages, login, protected private area) with a back-end-ready data layer.

**Architecture:** React SPA in layers: `types` → `services/api` (apiClient + swappable mock/http adapters) → `services/*Service` → `hooks` → `pages/components`. The mock adapter behaves like a REST server over seed data, so switching to the real API is one env var. Auth uses a Context + localStorage token; `ProtectedRoute` guards private routes and preserves the original destination.

**Tech Stack:** Vite, React 19, TypeScript (strict), React Router v7 (`react-router` package), Tailwind CSS v4, framer-motion, lucide-react, Manrope (`@fontsource-variable/manrope`), Vitest + Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-07-agroserv-design.md` (section 14 overrides earlier sections). Visual target: `docs/reference/visual-reference.jpeg`.

## Execution order

| # | File | Tasks | Deliverable |
|---|---|---|---|
| 1 | `plan_phase1_setup.md` | 1.1–1.2 | Vite project, Tailwind tokens, test setup, types, utils |
| 2 | `plan_phase2_data_layer.md` | 2.1–2.5 | Images, seeds, mock REST server, adapters, services, hooks, API contract |
| 3 | `plan_phase3_auth_routing.md` | 3.1–3.2 | AuthContext/AuthProvider, `useAuth`, paths, `ProtectedRoute` |
| 4 | `plan_phase4_ui_layout.md` | 4.1–4.2 | UI kit, Navbar, Footer, Sidebar |
| 5 | `plan_phase5_public_pages.md` | 5.1–5.4 | Domain cards, Home, Services, Service detail, routing |
| 6 | `plan_phase6_private_area.md` | 6.1–6.3 | Private layout + Dashboard, Login, Requests |
| 7 | `plan_phase7_verification.md` | 7.1–7.2 | README, full verification, browser QA |

All commands run from the project root: `/Users/jorgecamargo/Desktop/Mesa - MacBook Air de Jorge/web/agroserv`.

## Global Constraints

- No comments in code (no `//`, `/* */`, JSX comments or triple-slash directives).
- Variables, functions, types and file names in English. UI copy and URLs in PT-BR.
- Commit messages must NOT contain `Co-Authored-By` or any Claude/Claude Code attribution.
- Imports use relative paths (no path aliases).
- `tsconfig` from the Vite template has `verbatimModuleSyntax` and `erasableSyntaxOnly`: use `import type` for types; no enums, no constructor parameter properties.
- Router imports come from `react-router` (not `react-router-dom`).
- Pages and components never import from `src/data/` or `src/services/api/`.
- `src/data/` is imported only by `src/services/api/mockRoutes.ts` and test helpers in `src/test/`.
- Palette: `#173F2A`, `#2F6B45`, `#7FB685`, `#F7F8F5`, `#667085`, `#17201A`, `#FFFFFF` (+ warning `#B7791F`, danger `#B42318`, info `#2B5C8A`).
- Demo account: `produtor@agroserv.com` / `123456`. Session keys: `agroserv_token`, `agroserv_user`.
- Protected redirect message, exactly: `Faça login para acessar esta área.`
- Empty search message, exactly: `Não encontramos serviços para essa busca.`
- `prefers-reduced-motion` respected via `<MotionConfig reducedMotion="user">`.

## Review Focus

1. Search typed with or without accents/case/punctuation (`pulverizacao`, `Santa Helena, PR`) must still find services → tests in Task 2.2.
2. A corrupted `agroserv_user` value or an offline `/auth/me` must not crash or log the user out; only a 401 clears the session → tests in Tasks 1.2 and 3.1.
3. After login the user lands on the exact page they tried to open, including the query string (`/solicitacoes?status=completed`) → tests in Tasks 3.2 and 6.3.
4. Unknown ids/slugs/params in the URL (`/servicos/nao-existe`, `?category=inexistente`, `?status=invalido`) show a friendly state, never a crash or stale data from the previous page → tests in Tasks 2.2, 5.3, 5.4, 6.3.
5. Logging out from the private area lands on the homepage, not on the login screen with the "Faça login" warning → test in Task 6.1.
