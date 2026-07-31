# Orion v3 Nemesis - React Design System (nemesis-frontend)

This is the single source of truth for how every migrated screen should
look and feel. Do not invent new colors, spacing values, or layout
patterns outside of what's defined here - consistency across ~20+
migrated screens matters more than any individual screen's creativity.

## Brand and tone

Professional financial back-office terminal, not a consumer app. Think
Bloomberg Terminal / trading desk software: dense but organized
information, calm dark background, one confident accent color used
sparingly for emphasis (never decoratively). No purple, no default
Tailwind blue-on-white, no playful rounded-everything look.

## Color tokens (dark mode is default and primary; light mode optional toggle)

Define these as CSS variables in `src/index.css` (or
`globals.css`) and reference them everywhere via Tailwind config
`extend.colors`, never hardcode hex values in component files.

```css
:root {
  /* dark theme (default) */
  --background:        #0b1220;   /* near-black navy, main app background */
  --surface:            #111a2e;   /* card / panel background, one step up */
  --surface-elevated:   #16233d;   /* modals, dropdowns, popovers */
  --border:             #26324a;   /* hairline borders/dividers */
  --border-strong:      #34435f;   /* emphasized borders (focused input, active tab) */

  --foreground:         #e7ecf5;   /* primary text */
  --foreground-muted:   #9aa7bd;   /* secondary text, labels, placeholders */
  --foreground-faint:   #6b7a94;   /* disabled/tertiary text */

  --accent:             #d9a441;   /* amber/gold - primary accent, CTAs, active nav item */
  --accent-foreground:  #1a1305;   /* text on top of accent-colored surfaces */
  --accent-muted:       #3a3016;   /* subtle accent background (e.g. active row highlight) */

  --success:            #3ba55d;   /* positive/approved/completed states */
  --success-muted:      #16291c;
  --danger:             #d94f4f;   /* negative/rejected/error states */
  --danger-muted:       #2e1717;
  --warning:            #d9a441;   /* pending/attention states - reuses accent tone intentionally */
  --warning-muted:      #3a3016;
  --info:               #4a90d9;   /* neutral informational states, links */
  --info-muted:         #16233a;

  --focus-ring:         #d9a441;   /* focus outlines, use at 40-50% opacity */
}

.light {
  /* optional light theme, only if the user explicitly asks for a toggle */
  --background:        #f4f6fa;
  --surface:            #ffffff;
  --surface-elevated:   #ffffff;
  --border:             #dfe4ec;
  --border-strong:      #c3cbd9;
  --foreground:         #10192b;
  --foreground-muted:   #52607a;
  --foreground-faint:   #8b96a8;
  --accent:             #b3801f;
  --accent-foreground:  #ffffff;
  --accent-muted:       #f6ecd6;
  --success:            #1f8a45; --success-muted: #e6f4ea;
  --danger:             #c33c3c; --danger-muted:  #fbeaea;
  --warning:            #b3801f; --warning-muted: #f6ecd6;
  --info:               #2f6fad; --info-muted:   #e8f1fb;
  --focus-ring:         #b3801f;
}
```

Usage rules:
- Amber/gold (`--accent`) is used for: the active left-nav item, primary
  action buttons ("Onayla", "Kaydet", submit CTAs), focus rings, and
  loading/progress indicators. It is never used for large background
  fills - it's a highlight color, not a base color.
- Status colors (`success`/`danger`/`warning`/`info`) map directly to the
  domain status vocabulary already in the codebase: `TAMAMLANDI`/`ONAYLANDI`
  -> success, `IPTAL`/`REDDEDILDI`/`HATA` -> danger, `BEKLEMEDE`/`REVIZYONDA`
  -> warning, everything else informational -> info. Always pair a status
  badge with both a color AND the literal Turkish status text - never
  color-only, for accessibility and because these are business terms
  users already recognize from the old ZK screens.
- Never use pure black (`#000`) or pure white (`#fff`) for text/background
  in the dark theme - always the tokens above, which are slightly tinted
  navy for a calmer, less harsh screen.

## Typography

- UI font: **Inter** is acceptable here specifically because this is a
  dense data-terminal UI where legibility at small sizes matters more
  than expressive branding - but tune it: use `font-feature-settings:
  "tnum" 1` (tabular numbers) globally for anything showing monetary
  amounts, account numbers, or percentages, so columns of numbers align.
- Monospace font (e.g. `JetBrains Mono` or `IBM Plex Mono`) for: account
  numbers, IDs, instrument symbols, and any raw numeric grid column where
  digit alignment matters more than typographic warmth.
- Scale (Tailwind default scale is fine, just be consistent):
  - Page title: `text-xl font-semibold` (screen name, e.g. "Teminat Onay Ekrani")
  - Section/column headers: `text-sm font-medium uppercase tracking-wide text-[--foreground-muted]`
  - Table body: `text-sm`
  - Table header: `text-xs font-medium uppercase tracking-wide`
  - Detail panel labels: `text-xs text-[--foreground-muted]`, values `text-sm font-medium`

## Layout: the mandatory 3-column structure

Every migrated screen lives inside one persistent global shell:

```
+----------------------------------------------------------------+
| Top bar: Orion logo/wordmark | breadcrumb/page title | user menu |
+--------+---------------------------------+-----------------------+
|        |                                 |                       |
| Left   |   Middle column                 |  Right column         |
| nav    |   (search + data table)         |  (detail / actions)   |
| (~240- |                                 |                       |
| 260px, |                                 |                       |
| collap |                                 |                       |
| sible) |                                 |                       |
|        |                                 |                       |
+--------+---------------------------------+-----------------------+
```

- **Left column** (global, shared shell, built once): module navigation,
  mirrors the existing `nav/MenuRegistry.java` grouping and Turkish
  labels so users don't have to relearn the information architecture.
  Active item highlighted with `--accent-muted` background + `--accent`
  left border (4px) + `--accent` text - this is the ONE place accent is
  used as a background fill, and only as a subtle tint.
- **Middle column** (per-screen): search/filter bar pinned at the top,
  then the data table filling remaining height, internally scrollable
  (`overflow-y-auto`) so the shell itself never scrolls as a whole - only
  the table body does. Row click selects a record and populates the right
  column. Selected row gets `--accent-muted` background.
- **Right column** (per-screen): when nothing is selected, show a calm
  empty state (icon + "Bir kayit secin" muted text), not a blank void.
  When a row is selected: a header (record's key identifier + status
  badge), grouped detail fields below, and action buttons at the bottom
  of the panel (this replaces the old ZK pattern of one button-cluster
  per table row - buttons now live once, in the detail panel, acting on
  the currently selected record).

## Gestalt principles - apply these explicitly, not incidentally

When arranging every screen's content, deliberately apply:

- **Proximity**: group related fields with tighter spacing (`gap-2`)
  between them and larger spacing (`gap-6`/section dividers) between
  unrelated groups. E.g. in a detail panel: "Hesap No" + "Musteri Adi"
  are one proximity group (account identity), "Miktar" + "Para Birimi"
  are another (the transaction amount), separated by a visible gap or a
  thin `--border` divider, not just left to float in one long list.
- **Similarity**: all primary action buttons share the same visual
  treatment (accent-filled), all destructive actions share the same
  danger-colored treatment, all secondary/cancel actions share the same
  ghost/outline treatment - across every screen, not just within one.
  Status badges always use the same pill shape/size/font everywhere.
- **Common region**: use `--surface` colored cards/panels with a
  `--border` outline to visually contain each distinct region (the
  filter bar, the table, the detail panel are each their own bounded
  region) rather than relying on whitespace alone - this matters because
  financial screens are dense and users need clear containers to scan.
- **Figure/ground**: the currently selected table row and the currently
  active nav item must unambiguously read as "foreground/selected" via
  both color AND a left accent border, never color alone (some users may
  have the app on a dim/glare screen).
- **Continuity/alignment**: numeric columns right-aligned, text columns
  left-aligned, status columns center-aligned with the badge - and this
  alignment rule is consistent across every table in the app, so a
  user's eye can scan any screen the same way.
- **Closure/hierarchy**: don't make the right detail panel look like a
  disconnected floating box - give it a subtle top border/shadow
  connecting it visually to the middle column so the eye reads
  list-plus-detail as one coherent unit, not two unrelated widgets.

## Component conventions (shadcn/ui + Tailwind)

- Use shadcn `Table` for the middle column (or TanStack Table headless +
  shadcn styling if sorting/pagination gets complex) - never a raw HTML
  `<table>` with ad hoc classes.
- Use shadcn `Sheet` or a persistent right-column layout (not a modal) for
  the detail panel on desktop widths - modals are reserved for
  create/edit forms that are genuinely a separate step, not for viewing
  an already-selected record's detail.
- Use shadcn `Badge` for every status value, variant mapped to the status
  color rules above.
- Use shadcn `Button` variants consistently: `default` (accent-filled)
  for primary actions, `destructive` for reject/cancel/delete, `outline`
  or `ghost` for secondary actions, `secondary` for neutral actions like
  "Yenile"/"Excel Olustur".
- Use `sonner` (or shadcn `Toast`) for success/error notifications,
  mirroring old `Clients.showNotification` (success, brief, top-right)
  and old `Messagebox.ERROR` (error toast, doesn't auto-dismiss as
  quickly, or an inline alert banner within the right panel for
  validation errors tied to a specific field).
- Use shadcn `AlertDialog` for confirmation flows that replace ZK's
  `Messagebox.show(..., YES|NO, QUESTION, ...)` pattern - "Bu talebi
  onaylamak istediginize emin misiniz?" with Evet/Iptal, matching the
  original confirmation copy.

## Responsive behavior

- **>= 1280px (desktop, primary target)**: full 3-column layout as
  described above, left nav expanded.
- **1024-1279px (small laptop)**: left nav auto-collapses to icon-only
  (still visible, just narrower, ~64px, tooltips on hover for labels);
  middle and right columns keep their side-by-side layout.
- **768-1023px (tablet)**: right detail panel becomes an overlay
  (shadcn `Sheet` sliding in from the right) instead of a persistent
  column - selecting a row opens the sheet, closing it returns to the
  full-width table. Left nav collapses to icon-only or a hamburger-driven
  drawer.
- **< 768px (mobile)**: single column stack - left nav becomes a
  hamburger drawer, middle column table becomes a card-per-row list
  (each card shows the 3-4 most important fields, tapping opens the
  detail as a full-screen sheet). Do not attempt to cram a wide data
  table onto a phone screen by shrinking font size - restructure into
  cards instead.
- Never use raw pixel breakpoints scattered through component files - use
  Tailwind's default breakpoint scale (`sm`/`md`/`lg`/`xl`) consistently
  and centralize any custom breakpoint in `tailwind.config`.

## Motion (use sparingly, purposefully)

- Row selection: background color transitions over ~120ms
  (`transition-colors duration-150`), no bouncy easing.
- Right panel content swap (new record selected): a brief 100-150ms fade,
  not a slide (sliding implies spatial navigation, which is misleading
  here - it's a content swap, not a page change).
- Toasts: slide-in from top-right, auto-dismiss success after ~4s, errors
  stay until dismissed.
- Page/route transitions: none, or a very subtle fade - this is a dense
  data tool, not a marketing site; motion should never make the user wait
  or feel "designed at", it should feel instant and calm.

## Initial project scaffold (run once)

```bash
npm create vite@latest nemesis-frontend -- --template react-ts
cd nemesis-frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom @tanstack/react-query axios
npx shadcn@latest init
npx shadcn@latest add button table badge sheet dialog alert-dialog form input select toast sonner
```

Set up in this scaffold pass (once, reused by every later screen):
1. `tailwind.config` - `darkMode: 'class'`, extend `colors` to reference
   the CSS variables above (e.g. `background: 'var(--background)'`), add
   the `tnum` font-feature utility.
2. Global shell component: top bar + left nav (fed from a hardcoded or
   `/api/v1/nav/menu`-fetched list mirroring `MenuRegistry`) + a
   `<Outlet />` content area for React Router.
3. Base API client (`src/api/client.ts`) with the JWT auth header
   interceptor once auth exists.
4. Root `App.tsx` wraps everything in `<QueryClientProvider>` +
   `<BrowserRouter>` + the shell, dark mode class applied to `<html>` by
   default.
