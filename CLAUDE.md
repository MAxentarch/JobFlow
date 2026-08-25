# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # start the dev server (Turbopack) at http://localhost:3000
npm run build             # production build
npm run start              # run the production build
npm run lint                # ESLint
npx tsc --noEmit             # type-check without emitting files
```

Database (Prisma + Postgres, hosted on Railway — see "Hosting" below):

```bash
npx prisma migrate dev --name <name>   # after editing prisma/schema.prisma: create + apply a migration
npx prisma generate                     # regenerate the Prisma Client into src/generated/prisma (also runs automatically after npm install, via the postinstall script)
npx prisma db seed                       # WIPES all tasks and reloads the 3 example tasks from prisma/seed.ts
npx prisma studio                         # browse/edit the database in a GUI
railway variable list --service Postgres --json   # view the live DATABASE_URL and other Postgres connection details
```

`DATABASE_URL` in `.env` points at Railway's public proxy endpoint (not `*.railway.internal`, which only works from inside Railway). Since the database lives on Railway rather than on this computer, `npm run dev` now needs internet access to load or save any task.

There is no test suite configured in this project.

## Architecture

This is a small Next.js App Router app with one real page (the task list) backed by Postgres via Prisma. Data flows in one direction, split across three files in `src/app/`:

- **`page.tsx`** (Server Component) — fetches all tasks with `prisma.task.findMany()` and passes them as `initialTasks` to `TaskBoard`. This is the only place tasks are read.
- **`task-board.tsx`** (Client Component) — owns UI-only state (the active filter, which rows are mid-request) and renders the list. It receives fresh data from the server as a prop; because React won't reset `useState` just because a prop changes, it uses a render-time comparison (`if (initialTasks !== syncedTasks)`) rather than `useEffect` to resync local state whenever the server sends a new list — this is the React-recommended pattern for "adjust state when a prop changes" and avoids an extra render pass.
- **`actions.ts`** (Server Actions, `"use server"`) — the only place tasks are written. `addTask` is used as a `<form action>` with `useActionState` for the validation message; `setTaskStatus`/`deleteTask` are called directly from event handlers (not forms). Every mutation ends with `revalidatePath("/")`, which is what causes `page.tsx` to refetch and the new data to flow back down to `task-board.tsx`. (`toggleTask` still exists but is unused by the UI — it predates the 3-way status field and is kept only so the old `completed` boolean column stays reachable; safe to delete once that column is dropped.)

**Database layer:** `src/lib/prisma.ts` exports a single shared `PrismaClient` instance (cached on `globalThis` so Next.js's dev-mode hot reloading doesn't spawn a new DB connection on every file save). This project uses **Prisma 7**, which changed some conventions from older Prisma tutorials:
- The database connection URL lives in `prisma.config.ts` (reading `DATABASE_URL` from `.env`), not in `schema.prisma`'s `datasource` block.
- Postgres requires an explicit driver adapter (`@prisma/adapter-pg`) passed to `new PrismaClient({ adapter })` — there's no default built-in engine anymore.
- The generated client's entry point is `src/generated/prisma/client.ts`, not an `index.ts`.
- Seed config (`migrations.seed`) lives in `prisma.config.ts`, not in `package.json`.

If something about Prisma or Next.js behaves differently than expected, check `node_modules/next/dist/docs/` and `.agents/skills/` first — both ship version-matched reference docs for this exact install, which is newer than most training data.

## Hosting

The database is a Postgres instance on Railway (project "TaskFlow"), not a local file — this app originally used local SQLite (see git history) but was migrated over. The app itself is also deployed on Railway, as a second service called "web" in the same project. Live URL: https://web-production-b6940.up.railway.app

Useful commands:

```bash
railway status                     # show the linked project/environment
railway open                        # open the Railway dashboard for this project in a browser
railway logs --service Postgres      # view the database service's logs
railway logs --service web            # view the deployed app's logs
railway up --service web               # redeploy the app after code changes
```

The `Task` table still has an unused `completed` boolean column left over from the SQLite version, kept in sync by `setTaskStatus` as a safety net. It can be dropped in a future migration once nothing depends on it.

**Build/deploy configuration** lives in `railway.json`: `npm run build` / `npm run start`, on Node ≥20.19 (set via `"engines"` in `package.json` — Railway defaults to Node 18 otherwise, which is too old for Prisma 7 and fails the build). `package.json` also has `postinstall: prisma generate`, so Railway's build always regenerates the Prisma Client from the current `schema.prisma` before building.

The web service's `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}` (a Railway variable reference), which resolves to the fast, private `postgres.railway.internal` address — different from the public proxy URL used in local `.env`, since the deployed app and the database both run inside Railway's network.

`page.tsx` has `export const dynamic = "force-dynamic"` — without it, `next build` tries to pre-render the homepage (including its live database query) at build time, which fails because Railway's build machine can't reach `postgres.railway.internal` (only running services can). This also correctly matches the page's actual behavior: it should never serve stale cached data.

The public domain must target whatever port the app actually listens on at runtime (visible in `railway logs --service web` as `- Local: http://localhost:<port>`) — Railway assigns this dynamically per deployment via its own `PORT` variable, which `next start` respects automatically. It is **not** reliably 3000; check the logs rather than assuming.

## House rules

- Keep this project simple and beginner-friendly. Prefer small, readable changes over clever code.
