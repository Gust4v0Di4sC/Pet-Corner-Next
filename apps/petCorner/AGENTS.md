# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript application code.
  - `src/components/` holds feature-oriented UI modules (e.g., `Clientes`, `Home`, `Login`).
  - `src/contexts/` stores shared state and auth context.
  - `src/services/` contains API and data access helpers.
  - `src/utils/` and `src/types/` provide helpers and shared types.
- `src/assets/` is for images and static media used by the UI.
- `public/` hosts static files served directly by Vite.
- `dist/` is the production build output (generated).

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server for local development.
- `npm run build` type-checks with `tsc` and creates a production build in `dist/`.
- `npm run lint` runs ESLint across the project.
- `npm run preview` serves the production build locally for smoke testing.

## Coding Style & Naming Conventions
- Language: TypeScript + React (Vite).
- Follow existing patterns: PascalCase for components and component folders (`Login`, `Home`).
- Prefer named exports for shared utilities; default exports for top-level pages/components.
- Keep imports grouped (external, internal, styles) and run `npm run lint` before PRs.

## Testing Guidelines
- No automated test runner is configured in `package.json` yet.
- If you add tests, place them near the feature (e.g., `src/components/Login/Login.test.tsx`) and propose a test script in the same PR.

## Commit & Pull Request Guidelines
- Recent commits use short, lowercase, Portuguese verbs like `adicionando` or `corrigindo`.
- Keep commit subjects concise and action-focused (one idea per commit).
- PRs should include a brief summary, manual testing notes, and screenshots for UI changes.
- Link relevant issues or tasks when applicable.

## Security & Configuration Tips
- Environment variables live in `.env` using the `VITE_` prefix; avoid committing secrets outside Vite-safe keys.
- Firebase configuration is loaded in `src/firebase.ts` and should match `.env` values.
