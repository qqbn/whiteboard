# Collaborative Whiteboard

Projekt do nauki: tablica do współpracy w czasie rzeczywistym na własnym rendererze Canvas, Yjs (CRDT)
i własnym serwerze synchronizacji w NestJS. Cele nauki i zasady pracy są w [CLAUDE.md](CLAUDE.md).

## Stack

| Ścieżka               | Co                                                                    |
| --------------------- | --------------------------------------------------------------------- |
| `apps/whiteboard-web` | Next.js 16 (App Router), React 19, Tailwind 4, Zustand                |
| `apps/whiteboard-api` | NestJS 12 na Fastify, Drizzle + PostgreSQL, ioredis, `ws`             |
| `packages/contracts`  | Schematy Zod i typy wspólne dla web i api (kompilowane `tsc`)         |
| `packages/ui`         | Komponenty Radix + Tailwind ze Storybookiem (konsumowane jako źródło) |
| `packages/config`     | Wspólne presety tsconfig, ESLint (flat config), Prettier, lint-staged |

Turborepo + pnpm workspaces, TypeScript 6 (strict), Vitest, Playwright, Husky + lint-staged, GitHub Actions.

## Uruchomienie od zera

### 1. Wymagania

- **Node 24 LTS**: przypięty w polu `volta` w `package.json` (i w `.nvmrc` dla nvm/CI).
  Z [Voltą](https://volta.sh) właściwa wersja wybiera się sama.
- **pnpm 12.9.1**: przypięty w `packageManager`. Każdy pnpm ≥ 9.7 sam przełącza się na tę wersję.
- **Docker** (Docker Desktop, OrbStack albo Colima): tylko dla Postgresa i Redisa.
  Web działa bez niego. API wstaje, ale `/health` zwraca 503.

### 2. Instalacja

```bash
pnpm install
```

Przy okazji instalują się hooki gita (Husky, skrypt `prepare`).

### 3. Zmienne środowiskowe

```bash
cp apps/whiteboard-api/.env.example apps/whiteboard-api/.env
cp apps/whiteboard-web/.env.example apps/whiteboard-web/.env.local
```

API waliduje env przez Zod przy starcie i przy błędzie odmawia uruchomienia z listą złych zmiennych.

### 4. Baza i Redis

```bash
docker compose up -d     # Postgres 18 na :5432, Redis 8 na :6379 (z healthcheckami)
docker compose ps        # poczekaj, aż oba będą "healthy"
pnpm db:migrate          # aplikuje apps/whiteboard-api/drizzle/*.sql
```

### 5. Start

```bash
pnpm dev
```

- Web: http://localhost:3000/board/demo
- API: http://localhost:3001/health
- Storybook: `pnpm storybook` → http://localhost:6006

## Codzienne komendy

```bash
pnpm lint            # ESLint we wszystkich pakietach (przez turbo)
pnpm typecheck       # tsc --noEmit we wszystkich pakietach
pnpm test            # Vitest
pnpm test:e2e        # Playwright; za pierwszym razem: pnpm --filter whiteboard-web exec playwright install chromium
pnpm build           # buildy produkcyjne
pnpm format          # Prettier na całym repo
pnpm db:generate     # nowa migracja po zmianie apps/whiteboard-api/src/db/schema.ts
```

Komenda w jednym pakiecie: `pnpm --filter <nazwa> <skrypt>`, np. `pnpm --filter whiteboard-api dev`.

## Układ repo

```
apps/
  whiteboard-web/     src/app/board/[id] – strona z pełnoekranowym canvasem
                      src/canvas, src/sync – strefa nauki (patrz CLAUDE.md)
  whiteboard-api/     src/health, src/db, src/redis, src/config
                      src/sync – strefa nauki
packages/
  contracts/          src/protocol – strefa nauki
  ui/
  config/
docker-compose.yml    lokalny Postgres + Redis
turbo.json            graf zadań i cache
```

## CI

`.github/workflows/ci.yml` działa na pull requestach do `master` i pushach na `master`:
instalacja (cache store'a pnpm) → format check → lint → typecheck → test → build, z cache Turborepo
(`.turbo/cache`) zachowywanym między przebiegami.
