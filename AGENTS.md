# SMS EduTech — Project Conventions

## Code Reuse & Structure

- **Never duplicate code.** Before writing new components, check `src/components/ui/`, `src/components/shared/`, and `src/components/layouts/` for existing reusable components.
- **Extract before expanding.** If a component grows beyond ~300 lines, split it into smaller focused components. One file = one responsibility.
- **Shared state via stores** (`src/store/`). Page-local state stays in page components; cross-page state goes in Zustand stores.
- **Utility functions** go in `src/lib/` (pure functions, no React). Hooks go in `src/hooks/`.
- **PDF templates** go in `src/pages/<domain>/pdfTemplates/` as pure functions, not React components.
- **Test files** sit next to their source: `Component.tsx` → `Component.test.tsx`.

## When Adding New Features

1. **Reuse existing components** — check `src/components/ui/` and `src/components/shared/` first.
2. **Follow existing patterns** — look at a similar feature's structure before building from scratch.
3. **Keep it scalable** — design for growth. If it could apply to multiple domains, make it generic and configurable.
4. **No hardcoded values** — use CSS variables or `src/lib/styles.ts` constants. All font/spacing uses `rem`.
5. **Type safety** — use proper TypeScript types from the store or shared types. Avoid `as any`.

## Build & Test

- Build check: `npm run build` (tsc -b && vite build)
- Run tests: `npx vitest run`
- Test naming: `*.test.ts(x)` files use `src/test-setup.ts` and `vitest.config.ts`
- Zustand persist stores need `persist.clearStorage()` in `beforeEach` to avoid cross-test contamination

## Responsive Design

- Font sizes and spacing use `rem` (no hardcoded `px` for typography/layout)
- HTML `font-size` scales via media queries for responsive breakpoints
- Sidebar width uses `rem`, not fixed `px`
