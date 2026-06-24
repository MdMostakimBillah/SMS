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

## Refactoring & Code Splitting

When a file grows beyond ~300 lines, split it. Follow this proven approach:

### Step 1: Identify Tabs/Sections

Read the file and map out each tab/section with its line range. Group by:
- **Tab content** (e.g., RoutineTab, RoomsTab)
- **Modals** (e.g., PersonDetailModal)
- **Shared helpers** (e.g., statusBadge, weeklyHolidayBadge)

### Step 2: Extract Tab Components

Create `tabs/` or `modals/` subdirectory next to the parent file.

```
pages/attendance/index.tsx
pages/attendance/tabs/TodayTab.tsx
pages/attendance/tabs/RangeTab.tsx
pages/attendance/modals/PersonDetailModal.tsx
```

**Each extracted component needs:**
1. A `Props` interface at the top
2. Named export (not default) for tree-shaking
3. All imports it uses (don't rely on parent scope)
4. `React.memo` wrapping if it receives many props

### Step 3: Rewrite Parent as Orchestrator

The parent keeps:
- Store hooks and shared state
- Derived data (useMemo)
- Header, tab bar, filter controls
- Conditional rendering of tab components

The parent does NOT keep:
- Tab-specific state (move to the tab)
- Tab-specific handlers (move to the tab)
- Tab-specific modals (move to the tab or modals/)

### Step 4: Performance

**React.memo** — Add to any component that receives 5+ props or re-renders frequently:
```tsx
export const MyTab = React.memo(function MyTab({ ... }: Props) { ... })
```

**React.lazy** — Lazy-load heavy pages in `src/App.tsx`:
```tsx
const HeavyPage = React.lazy(() => import('./pages/heavy/Page'))
// Wrap route with <Suspense fallback={<LoadingSpinner />}>
```

### Step 5: Verify

1. `npm run build` — must pass with zero TS errors
2. `npx vitest run` — pre-existing failures are OK, no new failures
3. Check chunk sizes in build output — large chunks indicate further splitting needed

### Common Pitfalls

- **Unused imports** — After extracting, remove imports that moved to the child. TS6133 errors = unused imports.
- **Type mismatches** — Parent passes `Dispatch<SetStateAction<number>>` but child expects `(val: string) => void`. Wrap: `setPerPage={(v) => setPerPage(Number(v))}`
- **Props the child doesn't use** — Don't pass props the child removed from its interface.
- **React UMD global error** — If using `React.Dispatch` in types, import React explicitly.

### Shared Hooks Pattern

When the same logic appears in 3+ files, extract to `src/hooks/`:

```
src/hooks/useTabSlider.ts     — tab slider animation (used in 12+ files)
src/hooks/useNavChain.ts      — breadcrumb navigation chain (used in 8+ files)
src/hooks/useFormValidation.ts — form validation (used in multi-step forms)
```

Each hook:
- Returns a clean API (no raw state leakage)
- Accepts an options interface
- Has JSDoc on the hook and its parameters
