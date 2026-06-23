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

## Navigation Chain Feature

Breadcrumb navigation for redirect buttons (e.g., Syllabus → Classes → Subjects → Departments).

### How It Works

**Storage:**
- `localStorage.edutech_navChain` — array of `{ path, label }` objects (the chain)
- `sessionStorage.edutech_lastRedirect` — timestamp of last redirect click

**Redirect buttons** (push to chain + navigate):
```typescript
const chain = JSON.parse(localStorage.getItem('edutech_navChain') || '[]')
chain.push({ path: '/current-page', label: isBn ? 'বাংলা নাম' : 'English Name' })
localStorage.setItem('edutech_navChain', JSON.stringify(chain))
sessionStorage.setItem('edutech_lastRedirect', String(Date.now()))
navigate('/target-page')
```

**Page mount** (clear chain if direct navigation):
```typescript
useEffect(() => {
  const lastRedirect = sessionStorage.getItem('edutech_lastRedirect')
  const now = Date.now()
  if (!lastRedirect || now - Number(lastRedirect) > 30000) {
    localStorage.removeItem('edutech_navChain')
  }
}, [])
```

**Back button** (pop from chain):
```typescript
const chain = JSON.parse(localStorage.getItem('edutech_navChain') || '[]')
if (chain.length > 0) {
  const prev = chain[chain.length - 1]
  localStorage.setItem('edutech_navChain', JSON.stringify(chain.slice(0, -1)))
  navigate(prev.path)
} else {
  navigate('/') // fallback
}
```

**Breadcrumb display** (only when chain has items):
```typescript
const chain = JSON.parse(localStorage.getItem('edutech_navChain') || '[]')
if (chain.length === 0) return null // no breadcrumb
// render breadcrumb items...
```

### Pages Using Navigation Chain

| Page | Path | Redirects To | Chain Label |
|------|------|--------------|-------------|
| Syllabus | `/syllabus` | `/classes` | `পাঠ্যক্রম` / `Syllabus` |
| Class Management | `/classes` | `/teachers/subjects` | `শ্রেণি` / `Classes` |
| Subjects | `/teachers/subjects` | `/teachers/departments` | `বিষয়` / `Subjects` |
| Departments | `/teachers/departments` | — | `বিভাগ` / `Departments` |

### Rules

1. **Redirect button clicked** → push current page to chain, set timestamp, navigate
2. **Page loads with recent timestamp** (< 30s) → keep chain (redirect navigation)
3. **Page loads without timestamp or stale** → clear chain (direct/sidebar navigation)
4. **User stays on same page** → chain persists (no re-mount clears it)
5. **Back button clicked** → pop last item from chain, navigate to previous page
6. **Breadcrumb item clicked** → truncate chain to that point, navigate
