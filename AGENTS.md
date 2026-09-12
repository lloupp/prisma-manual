# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 app using the App Router and TypeScript. Route files live in `app/` (`app/page.tsx`, `app/search/page.tsx`, and feature folders such as `app/guides/` and `app/systems/`). Reusable UI is split into `components/` by concern (`cards/`, `car/`, `layout/`, `search/`, `badges/`). Static domain content lives in `data/`, shared helpers in `lib/`, and domain types in `types/`. Prisma schema, migrations, and seed logic live in `prisma/`. Public assets belong in `public/images/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run ESLint (`eslint-config-next` core-web-vitals + TypeScript rules).
- `npm run typecheck`: run TypeScript without emitting files.
- `npx prisma migrate dev`: apply local schema changes to SQLite.
- `npx tsx prisma/seed.ts`: repopulate `dev.db` from the files in `data/`.
- `npm run test`: run the content-integrity test suite (vitest).

Run `npm run lint && npm run typecheck && npm run test` before opening a PR. Use `.env` for `DATABASE_URL`; `lib/prisma.ts` currently defaults to `file:./dev.db` for local work.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Follow the existing code style: single quotes, semicolons, and simple named exports in shared modules. Keep route components and UI components in `PascalCase` (`CategoryCard.tsx`), utilities in lowercase files (`lib/utils.ts`), and data/type files in lowercase or camelCase by domain (`data/guides.ts`, `types/repairGuide.ts`). Prefer small, focused edits over broad rewrites.

## Testing Guidelines
`tests/content-integrity.test.ts` (vitest) enforces the technical-accuracy rules for this project: every specification/part/fluid/interval/torque marked with a confidence above `UNVERIFIED` must have a matching `SourceReference`, `OFFICIAL` claims need an `OFFICIAL`-confidence reference, every `TorqueSpecification` row must cite a source (the table may simply stay empty instead), and every guide needs a non-empty `precautions` list, a valid `partId`, and sequential step numbers. Run `npm run test` before adding or changing anything in `data/parts.ts`, `data/guides.ts`, `data/specifications.ts`, `data/fluid-specifications.ts`, `data/maintenance-intervals.ts`, `data/torque-specifications.ts`, or `data/source-references.ts`. Never add a specification with `confidence` above `UNVERIFIED` without a real, checkable source in `data/sources.ts` — see the "Rastreabilidade" rules for this project. Beyond content integrity, treat `lint`, `typecheck`, and a local smoke test in `npm run dev` as the minimum validation for app-code changes.

## Commit & Pull Request Guidelines
Git history is not available in this directory, so no local commit convention can be inferred. Use short, imperative commit messages such as `feat: add guide search filters` or `fix: handle empty systems list`. PRs should include a concise description, affected paths, validation commands, and screenshots for UI changes. Link the related issue when one exists.

## Security & Configuration Tips
Do not commit secrets from `.env`. Avoid editing generated output in `.next/` or dependencies in `node_modules/`. Database changes should include the Prisma schema update and matching migration files under `prisma/migrations/`.
