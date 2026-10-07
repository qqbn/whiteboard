# CLAUDE.md – Collaborative Whiteboard (projekt do nauki)

## Kontekst

To projekt edukacyjny. Jestem frontend developerem z 4+ latami doświadczenia (React, TypeScript).
Celem NIE jest jak najszybsze dowiezienie aplikacji, tylko nauczenie się:
- CRDT (Yjs) i synchronizacji w czasie rzeczywistym,
- WebSocketów i backendu w NestJS,
- renderowania na Canvas bez DOM,
- skalowania i obserwowalności systemów real-time.

Jeśli kiedykolwiek wybór jest między „szybciej” a „więcej się nauczę”, wybieraj to drugie.

## Stack

- Monorepo: Turborepo + pnpm workspaces
- `apps/whiteboard-web` – Next.js (App Router), React 19, TypeScript strict, Zustand (stan UI)
- `apps/whiteboard-api` – NestJS (adapter Fastify), WebSocket Gateway na `ws` (nie Socket.IO)
- `packages/contracts` – schematy Zod i typy wiadomości wspólne dla frontu i backendu
- `packages/ui` – komponenty (Radix + Tailwind)
- CRDT: Yjs + y-protocols, offline przez y-indexeddb
- Baza: PostgreSQL + Drizzle; Redis do pub/sub
- Lokalnie wszystko przez `docker compose up`
- Testy: Vitest, Playwright

## Strefy kodu

### Strefa NAUKI – tu NIE piszesz implementacji

- `apps/whiteboard-web/src/canvas/` – rendering, pętla rAF, transformacje ekran ↔ świat, hit-testing
- `apps/whiteboard-web/src/sync/` – integracja Y.Doc, awareness, undo/redo
- `apps/whiteboard-api/src/sync/` – Gateway, protokół sync, pokoje, snapshoty, Redis pub/sub
- `packages/contracts/src/protocol/` – format wiadomości WebSocket

W tych folderach:
1. Nie twórz ani nie edytuj plików z logiką. Możesz dodać pusty szkielet (sygnatury funkcji, typy,
   komentarze `// TODO(ja): ...`) tylko jeśli o to poproszę.
2. Gdy pytam „jak to zrobić?”, najpierw zadaj mi 1–2 pytania naprowadzające albo wytłumacz koncepcję.
   Pseudokod i krótkie przykłady spoza mojego projektu są OK, gotowa implementacja nie.
3. Przy debugowaniu dawaj podpowiedzi stopniowo: najpierw gdzie szukać, potem co sprawdzić,
   rozwiązanie dopiero, gdy wprost napiszę „pokaż rozwiązanie”.
4. Gdy proszę o review: oceniaj jak senior na code review. Wypunktuj błędy, ryzyka (wyścigi,
   wycieki pamięci, edge case'y przy reconnect, bezpieczeństwo) i pytania. Nie poprawiaj kodu sam.
5. Po każdym większym kroku zadaj mi jedno pytanie sprawdzające zrozumienie.

Wyjątek: jeśli napiszę „napisz za mnie”, możesz zaimplementować, ale potem wyjaśnij każdą
nieoczywistą decyzję.

### Strefa DELEGOWANA – tu pisz normalnie

Wszystko inne: konfiguracja monorepo, Docker, CI, boilerplate modułów Nest, auth, komponenty UI,
toolbar, panele, formularze, seedy, upload plików, część testów.
Przy tej strefie i tak krótko napisz, co i dlaczego zrobiłeś, żebym mógł to zrozumieć.

## Zasady ogólne

- Nie dodawaj zależności bez zapytania. Jeśli coś da się zrobić samemu w rozsądnym czasie i to jest
  wartość nauki (np. własny serwer sync zamiast Hocuspocus), zaproponuj zrobienie tego samemu.
- Zanim zaczniesz większą zmianę, przedstaw plan i poczekaj na moją akceptację.
- Kiedy odpowiadasz na pytanie koncepcyjne, odnoś się do mojego kodu i mojego etapu, nie ogólnie.
- Jeśli zauważysz, że moje podejście ma poważny problem, powiedz to wprost, nawet jeśli o to nie pytam.
- Odpowiadaj po polsku, nazwy w kodzie po angielsku.

## Aktualny etap

<!-- Aktualizuj tę sekcję przy przejściu do kolejnego etapu -->

**Etap 1: Canvas single-player**
Cel nauki: własny rendering bez DOM, układ współrzędnych (pan/zoom), oddzielenie modelu od widoku.
Zakres: prostokąt, elipsa, strzałka, tekst; zaznaczanie, przesuwanie, zmiana rozmiaru; pan i zoom.
Jeszcze BEZ Yjs i backendu – model trzymam w zwykłym obiekcie, żeby potem świadomie przejść na Y.Doc.

Kolejne etapy (do przeniesienia tutaj, gdy dojdę):
2. CRDT lokalnie (Y.Doc, BroadcastChannel, UndoManager)
3. Własny serwer sync w NestJS (Gateway, sync step 1/2, snapshoty, y-indexeddb)
4. Presence i UX współpracy (kursory, interpolacja, throttling)
5. Wydajność i skala (rbush, PixiJS, Redis pub/sub, k6)
6. Produkcja (Docker, deploy, OpenTelemetry, Playwright z dwoma użytkownikami)

## Komendy

Node 24 (Volta: pole `volta` w root package.json, `.nvmrc`), pnpm 12.9.1 (`packageManager`).

```bash
pnpm install
cp apps/whiteboard-api/.env.example apps/whiteboard-api/.env
docker compose up -d                       # Postgres 18 :5432, Redis 8 :6379
pnpm db:migrate                            # migracje Drizzle (apps/whiteboard-api/drizzle)
pnpm db:generate                           # nowa migracja po zmianie src/db/schema.ts

pnpm dev                                   # web :3000, api :3001, contracts w trybie watch
pnpm --filter whiteboard-web dev
pnpm --filter whiteboard-api dev           # = nest start --watch
pnpm storybook                             # packages/ui :6006

pnpm lint && pnpm typecheck
pnpm test                                  # Vitest (web, api, contracts)
pnpm --filter whiteboard-web exec playwright install chromium   # raz
pnpm test:e2e                              # Playwright (buduje web i odpala next start)
pnpm build
pnpm format                                # Prettier (pre-commit robi to samo na staged)

curl localhost:3001/health                 # 200 gdy Postgres i Redis działają, inaczej 503
```

## Notatki z nauki

Po każdym etapie zapisuję wnioski w `docs/learning/etap-N.md` własnymi słowami.
Możesz je czytać, żeby wiedzieć, co już rozumiem, ale nie pisz ich za mnie.
Na moją prośbę możesz mnie z nich odpytać jak na rozmowie rekrutacyjnej.
