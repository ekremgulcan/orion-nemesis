# Data Visualization Guide (nemesis-frontend)

Not every migrated screen needs a chart - most are still primarily a
searchable table + detail panel, and that stays the correct default. But
some screens are backed by data that is genuinely easier to understand
visually (a distribution across statuses, a trend over time, a
concentration by category/currency, a KPI that summarizes dozens of rows
into one number). For those screens, add a small, purposeful
visualization - it should look like a trading-terminal stat panel, not a
marketing-dashboard illustration.

## When to add a visualization (decision checklist)

Add a chart or KPI strip ONLY when at least one of these is true for the
screen's data:

- **Status/category distribution**: the list has a `durum`/type field
  with more than ~3 meaningful values and the user would benefit from
  seeing proportions at a glance (e.g. how many transfers are
  BEKLEMEDE/TAMAMLANDI/IPTAL right now) -> small donut or horizontal bar.
- **Aggregate KPIs**: the screen's whole point is monitoring a handful of
  numbers derived from many rows (total balance, count pending, sum by
  currency) -> a KPI strip of 3-5 stat cards above or beside the table.
- **Time series**: the entity has a date/timestamp and trend-over-time is
  meaningful (daily transaction volume, balance history) -> a small area
  or line chart.
- **Concentration/ranking**: "top N accounts by X" or "breakdown by
  currency/market/instrument type" -> a horizontal bar list.

Do NOT add a chart when:
- The table already has fewer than ~15-20 rows total (a chart adds noise,
  not insight, at that scale).
- The data is purely transactional/action-oriented with no natural
  aggregate (e.g. a single record's own detail fields - never chart a
  single row's own attributes).
- You'd have to invent a metric that doesn't already exist in the
  ViewModel/Service/DTO - never fabricate business metrics. Only
  visualize numbers the backend actually returns or that are trivially
  derivable client-side from the existing DTO list (counts, sums,
  group-bys of fields already present).

When in doubt, prefer a **KPI strip** (cheap, always safe, reads like a
terminal) over a chart (higher risk of looking decorative).

## Library and setup

Use `recharts` (already added as a dependency the first time this guide
is used - `npm install recharts` if `package.json` doesn't have it yet).
It's SVG-based, tree-shakeable, composes well with Tailwind, and every
component takes a plain `data` array - no adapter/wrapper library needed.

Do not use Chart.js, D3 directly, or any heavier charting framework -
recharts covers every case in this guide and keeps the bundle small.

## Placement in the 3-column layout

Charts/KPIs are **middle-column citizens** - they live above the data
table, inside the same scrollable middle column, never in the left nav
and never replacing the right detail panel. Typical structure:

```
Middle column:
  [ KPI strip: 3-5 stat cards ]      <- optional, only if useful
  [ small chart, if applicable ]      <- optional, only if useful
  [ search/filter bar ]
  [ data table, fills remaining height ]
```

The chart/KPI block must NOT push the table below the fold in a way that
requires scrolling to see the first table row on a standard 1280x800
viewport - keep it compact (a KPI strip is one row of cards, ~80-96px
tall; a chart is at most ~180-220px tall).

## KPI strip pattern

A row of 3-5 compact stat cards, each showing one derived number. Use
`grid grid-cols-2 gap-3 sm:grid-cols-4` (wrap on narrow widths per the
responsive rules in design-system.md).

```tsx
function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" | "warning" | "info" }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className={cn(
        "mt-1 font-mono text-xl font-semibold tnum",
        tone === "success" && "text-success",
        tone === "danger" && "text-danger",
        tone === "warning" && "text-warning",
        tone === "info" && "text-info",
        !tone && "text-foreground"
      )}>
        {value}
      </p>
    </div>
  )
}
```

Compute the values with a `useMemo` over the already-fetched list query
data - never a separate API call just for a KPI number unless the backend
truly can't return the raw rows needed to derive it client-side (e.g. a
huge table where only a pre-aggregated summary endpoint is feasible - in
that case, add a `GET .../summary` endpoint following the same DTO
pattern, don't invent client-only numbers that don't reconcile with the
table).

## Chart color mapping (reuse design tokens, never invent new hues)

Charts must use the exact same CSS variables as everything else - pull
them at render time via `getComputedStyle` or hardcode the same hex
values already defined in `index.css` (`--accent`, `--success`,
`--danger`, `--warning`, `--info`, `--foreground-muted`, `--border`).
Never let recharts fall back to its default rainbow palette.

```tsx
const CHART_COLORS = {
  accent: "#d9a441",
  success: "#3ba55d",
  danger: "#d94f4f",
  warning: "#d9a441",
  info: "#4a90d9",
  muted: "#6b7a94",
  grid: "#26324a",
}

const STATUS_COLOR: Record<string, string> = {
  TAMAMLANDI: CHART_COLORS.success,
  ONAYLANDI: CHART_COLORS.success,
  IPTAL: CHART_COLORS.danger,
  REDDEDILDI: CHART_COLORS.danger,
  BEKLEMEDE: CHART_COLORS.warning,
  REVIZYONDA: CHART_COLORS.warning,
  HAVUZDA: CHART_COLORS.info,
}
```

## Donut (status distribution) pattern

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

<div className="h-44 rounded-lg border border-border bg-surface p-3">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={statusBreakdown}
        dataKey="count"
        nameKey="durum"
        innerRadius="60%"
        outerRadius="85%"
        paddingAngle={2}
        stroke="none"
      >
        {statusBreakdown.map((entry) => (
          <Cell key={entry.durum} fill={STATUS_COLOR[entry.durum] ?? CHART_COLORS.muted} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{ background: "#16233d", border: "1px solid #26324a", borderRadius: 8, fontSize: 12 }}
        itemStyle={{ color: "#e7ecf5" }}
      />
    </PieChart>
  </ResponsiveContainer>
</div>
```

Pair every donut with a small legend list to its side (label + color dot
+ count + %) - never rely on hover-only tooltips for the primary reading,
per the figure/ground accessibility rule in design-system.md.

## Horizontal bar (ranking/concentration) pattern

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={topAccounts} layout="vertical" margin={{ left: 8, right: 16 }}>
    <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
    <XAxis type="number" tick={{ fill: "#9aa7bd", fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.grid }} />
    <YAxis type="category" dataKey="hesapNo" tick={{ fill: "#9aa7bd", fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={{ background: "#16233d", border: "1px solid #26324a", borderRadius: 8, fontSize: 12 }} />
    <Bar dataKey="bakiye" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
  </BarChart>
</ResponsiveContainer>
```

## Line/area (time series) pattern

Only use when the DTO has a real date field with enough distinct points
(> ~5) to make a trend visible - a 3-point line is noise, not insight.

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

<ResponsiveContainer width="100%" height={180}>
  <AreaChart data={dailyVolume}>
    <defs>
      <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
        <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
    <XAxis dataKey="tarih" tick={{ fill: "#9aa7bd", fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
    <YAxis tick={{ fill: "#9aa7bd", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
    <Tooltip contentStyle={{ background: "#16233d", border: "1px solid #26324a", borderRadius: 8, fontSize: 12 }} />
    <Area type="monotone" dataKey="tutar" stroke={CHART_COLORS.accent} fill="url(#accentFill)" strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>
```

## Motion and interaction

- No animated chart entrance beyond recharts' default (~300ms is fine,
  don't disable it, but don't add extra custom animation on top).
- Clicking a donut slice or bar MAY filter the table below (e.g. click
  the "BEKLEMEDE" slice to filter the table to that status) - this is a
  nice, cheap interaction win, but is optional, not required, per screen.
- Never make the chart the only way to see a number that's also in the
  table/KPI strip - charts are a secondary, glanceable view, the table
  remains the source of truth.

## Retrofitting an already-migrated screen

When the user asks to add visualization to a screen that was already
migrated before this guide existed, apply the decision checklist above
first - not every existing screen needs one. A good, low-risk retrofit
target list, in order of value:
1. Screens with a status-tabbed table (add a KPI strip mirroring the tab
   counts already computed client-side - free, no new backend call).
2. Screens with a currency/amount field across many rows (KPI strip:
   total by currency, or a small donut of currency breakdown).
3. Screens with a search+list of accounts/balances (horizontal bar of
   top N by amount).

Always re-run Phase 3 verification (`npm run build`, screenshot, confirm
old ZK screen untouched) after adding a visualization, exactly like any
other screen change.
