# Card Design Convention

All stat/summary cards in the app must follow this glass morphism design pattern.
This ensures visual consistency across every page.

## Stat Card Pattern

```tsx
<div
  className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'none'
  }}
>
  <div
    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
    style={{ background: 'var(--green-light)' }}
  >
    <IconSize15 style={{ color: 'var(--green)' }} />
  </div>
  <div className="min-w-0">
    <div className="text-[var(--text-primary)] leading-none font-bold text-lg">
      {value}
    </div>
    <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">
      {label}
    </div>
  </div>
</div>
```

## Rules

1. **Container**: Always use `glass rounded-[0.75rem]` — never `border border-[var(--border)] bg-[var(--bg-primary)]`
2. **Layout**: Value first (large, bold), label below (small, muted)
3. **Icon wrapper**: `w-8 h-8 rounded-lg` with inline `style={{ background }}` using CSS variable
4. **Icon size**: Always `size={15}` with `style={{ color }}` for the color
5. **Value**: `text-lg font-bold text-[var(--text-primary)]`
6. **Label**: `text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]`
7. **Grid**: Use `gap-[0.625rem]` between cards
8. **Hover**: Add `translateY(-2px)` and `boxShadow` on mouse enter/leave

## Color Variables

| Purpose | Icon BG | Icon Color |
|---------|---------|------------|
| Success/Income | `var(--green-light)` | `var(--green)` |
| Warning/Pending | `var(--amber-light)` | `var(--amber)` |
| Error/Overdue | `var(--red-light)` | `var(--red)` |
| Info/Waived | `var(--purple-light)` | `var(--purple)` |
| Brand/Payments | `var(--brand-light)` | `var(--brand)` |
| Neutral/Count | `var(--teal-light)` | `var(--teal)` |

## Pages Using This Pattern

- `src/pages/finance/index.tsx` — Fee Management overview (4 cards)
- `src/pages/finance/tabs/CollectTab.tsx` — Today's summary (3 cards)
- `src/pages/finance/tabs/ReportsTab.tsx` — Collection stats (6 cards)
- `src/pages/finance/tabs/PaymentsTab.tsx` — Payment summary (3 cards)
- `src/pages/finance/tabs/WaiversTab.tsx` — Waived total (1 card)
- `src/pages/finance/tabs/InactiveDuesTab.tsx` — Inactive dues (2 cards)
