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

Database (Prisma + SQLite, file lives at `dev.db` in the project root):

```bash
npx prisma migrate dev --name <name>   # after editing prisma/schema.prisma: create + apply a migration
npx prisma generate                     # regenerate the Prisma Client into src/generated/prisma (also runs automatically after npm install, via the postinstall script)
npx prisma db seed                       # WIPES all tasks and reloads the 3 example tasks from prisma/seed.ts
npx prisma studio                         # browse/edit the database in a GUI
```

There is no test suite configured in this project.

## Architecture

This is a small Next.js App Router app with one real page (the task list) backed by SQLite via Prisma. Data flows in one direction, split across three files in `src/app/`:

- **`page.tsx`** (Server Component) — fetches all tasks with `prisma.task.findMany()` and passes them as `initialTasks` to `TaskBoard`. This is the only place tasks are read.
- **`task-board.tsx`** (Client Component) — owns UI-only state (the active filter, which rows are mid-request) and renders the list. It receives fresh data from the server as a prop; because React won't reset `useState` just because a prop changes, it uses a render-time comparison (`if (initialTasks !== syncedTasks)`) rather than `useEffect` to resync local state whenever the server sends a new list — this is the React-recommended pattern for "adjust state when a prop changes" and avoids an extra render pass.
- **`actions.ts`** (Server Actions, `"use server"`) — the only place tasks are written. `addTask` is used as a `<form action>` with `useActionState` for the validation message; `toggleTask`/`deleteTask` are called directly from event handlers (not forms). Every mutation ends with `revalidatePath("/")`, which is what causes `page.tsx` to refetch and the new data to flow back down to `task-board.tsx`.

**Database layer:** `src/lib/prisma.ts` exports a single shared `PrismaClient` instance (cached on `globalThis` so Next.js's dev-mode hot reloading doesn't spawn a new DB connection on every file save). This project uses **Prisma 7**, which changed some conventions from older Prisma tutorials:
- The database connection URL lives in `prisma.config.ts` (reading `DATABASE_URL` from `.env`), not in `schema.prisma`'s `datasource` block.
- SQLite requires an explicit driver adapter (`@prisma/adapter-better-sqlite3`) passed to `new PrismaClient({ adapter })` — there's no default built-in engine anymore.
- The generated client's entry point is `src/generated/prisma/client.ts`, not an `index.ts`.
- Seed config (`migrations.seed`) lives in `prisma.config.ts`, not in `package.json`.

If something about Prisma or Next.js behaves differently than expected, check `node_modules/next/dist/docs/` and `.agents/skills/` first — both ship version-matched reference docs for this exact install, which is newer than most training data.

## House rules

- Keep this project simple and beginner-friendly. Prefer small, readable changes over clever code.
