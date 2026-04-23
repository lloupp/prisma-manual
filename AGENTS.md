# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 app using the App Router and TypeScript. Route files live in `app/` (`app/page.tsx`, `app/search/page.tsx`, and feature folders such as `app/guides/` and `app/systems/`). Reusable UI is split into `components/` by concern (`cards/`, `car/`, `layout/`, `search/`, `badges/`). Static domain content lives in `data/`, shared helpers in `lib/`, and domain types in `types/`. Prisma schema, migrations, and seed logic live in `prisma/`. Public assets belong in `public/images/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run Next.js lint checks.
- `npm run typecheck`: run TypeScript without emitting files.
- `npx prisma migrate dev`: apply local schema changes to SQLite.
- `npx tsx prisma/seed.ts`: repopulate `dev.db` from the files in `data/`.

Run `npm run lint && npm run typecheck` before opening a PR. Use `.env` for `DATABASE_URL`; `lib/prisma.ts` currently defaults to `file:./dev.db` for local work.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Follow the existing code style: single quotes, semicolons, and simple named exports in shared modules. Keep route components and UI components in `PascalCase` (`CategoryCard.tsx`), utilities in lowercase files (`lib/utils.ts`), and data/type files in lowercase or camelCase by domain (`data/guides.ts`, `types/repairGuide.ts`). Prefer small, focused edits over broad rewrites.

## Testing Guidelines
There is no automated test suite in the repository yet. Treat `lint`, `typecheck`, and a local smoke test in `npm run dev` as the minimum validation. When adding behavior, verify the affected route and any Prisma-backed reads manually. If you add tests later, place them near the feature or in a dedicated `tests/` folder and name them `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Git history is not available in this directory, so no local commit convention can be inferred. Use short, imperative commit messages such as `feat: add guide search filters` or `fix: handle empty systems list`. PRs should include a concise description, affected paths, validation commands, and screenshots for UI changes. Link the related issue when one exists.

## Security & Configuration Tips
Do not commit secrets from `.env`. Avoid editing generated output in `.next/` or dependencies in `node_modules/`. Database changes should include the Prisma schema update and matching migration files under `prisma/migrations/`.
