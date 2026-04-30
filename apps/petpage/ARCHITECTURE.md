# Petpage Architecture

`petpage` uses Next.js App Router with route-first composition and feature modules.

## Structure

- `src/app`: route folders, route handlers, layouts, loading/error/not-found files.
- `src/components`: global reusable components, including shadcn-style primitives in `src/components/ui`.
- `src/features`: domain modules grouped by application feature.
- `src/lib`: shared helpers, integrations, auth/session, routing, Firebase and Stripe infrastructure.
- `src/providers`: global React providers and client initializers.
- `src/styles`: global stylesheet entrypoints.

## Conventions

- Keep route files thin and compose feature page components from `src/features/*/pages`.
- Import feature code through `@/features/<feature>/...`.
- Use `@/components/ui` for generic buttons, inputs, selects, cards, alerts and overlays.
- Keep `/app-react/*` isolated as the legacy SPA boundary.
- Keep `src/proxy.ts` as the request guard for protected routes.
