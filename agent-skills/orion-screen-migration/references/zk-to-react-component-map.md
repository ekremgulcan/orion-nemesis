# ZK7 Widget -> React/shadcn Component Map

Concrete translation table for the ZK widgets actually used across the
existing Orion `.zul` screens. Use this when converting a specific
widget, not as a layout guide (layout rules are in design-system.md).

## Data display

| ZK widget | React equivalent | Notes |
|---|---|---|
| `<listbox mold="paging">` + `<listhead>`/`<listitem>` | shadcn `Table` (or TanStack Table headless + shadcn styling) inside the middle column, with client- or server-side pagination via TanStack Query | Column widths (`width="120px"` etc.) become Tailwind `w-[...]` classes on `<TableHead>`; keep the same column order and Turkish header labels verbatim. |
| `emptyMessage="No Rows To Show"` | A centered empty-state row/component inside the table body | Keep an equivalent Turkish or neutral empty message, styled with `--foreground-muted`, not a jarring placeholder. |
| `<listcell label="@load(each.durum eq 'BEKLEMEDE')">`-style conditional visibility | Conditional render (`{row.durum === 'BEKLEMEDE' && ...}`) | Any per-row action buttons in ZK become: (a) a compact icon-button in the row for quick actions, AND/OR (b) the primary way to act - select the row, use the right detail panel's action buttons. Prefer (b) as the primary flow per the 3-column design; use per-row icon buttons only for very frequent single-click actions if the user explicitly wants that density. |
| `<tabbox>` splitting result sets (e.g. "Uygun Hale Gelenler" / "Uygun Hale Gelmeyenler") | shadcn `Tabs` above the middle column table, each tab swapping the table's data source | Keep tab labels + counts exactly as before, e.g. `"Uygun Hale Gelenler (12)"`. |

## Forms and inputs

| ZK widget | React equivalent | Notes |
|---|---|---|
| `<textbox>` | shadcn `Input` | - |
| `<decimalbox>` | shadcn `Input type="number"` with `step` matching the original decimal precision, or a masked numeric input if currency formatting is needed | Always right-align numeric inputs per design-system.md alignment rule. |
| `<datebox>` (ZK7 only supports `java.util.Date`, never `LocalDate`) | shadcn `Calendar` + `Popover` ("date picker") pattern, backed by a plain ISO date string (`yyyy-MM-dd`) over the wire | The old `LocalDate` restriction was a ZK7/Hibernate quirk specific to the Java side - it does NOT apply to the new DTO/REST layer. New DTOs and the new React forms should use `LocalDate`/ISO date strings normally; only the legacy ZK-bound entities keep using `java.util.Date` internally if they must stay bound to old ZK screens. |
| `<combobox>` | shadcn `Select` (or `Combobox` with a search input if the option list is long, e.g. instrument/customer pickers) | - |
| `<checkbox-listbox checkmark="true">` (single-select) | shadcn `RadioGroup`-style single selection, OR a table with radio-style row selection | Remember the ZK quirk: `checkmark="true"` alone acts like radio buttons; `checkmark="true" multiple="true"` is needed for true multi-select in ZK. This quirk is ZK-specific and irrelevant in React - just implement single or multi selection directly with a checkbox column and normal state. |
| `<checkbox-listbox checkmark="true" multiple="true">` (multi-select) | A checkbox column in the shadcn `Table`, with a "select all" header checkbox and a floating bulk-action bar appearing when 1+ rows are checked | This is the natural home for any "apply to selected" bulk command from the old ZK screen. |

## Actions and feedback

| ZK pattern | React equivalent | Notes |
|---|---|---|
| `Messagebox.show("Mesaj?", "Onay", YES|NO, QUESTION, handler)` | shadcn `AlertDialog` with matching title/body copy and Evet/Iptal (or Onayla/Vazgec) buttons, calling the mutation `onConfirm` | Preserve the exact Turkish confirmation copy from the ZK code. |
| `Messagebox.show(ex.getMessage(), "Hata", OK, ERROR)` | Error `toast` (sonner) OR inline alert in the right detail panel if the error is about the currently selected record | Use the API's `message` field verbatim (see backend-integration.md exception mapping) - never paraphrase a domain validation message. |
| `Clients.showNotification("Islem tamamlandi.")` | Success `toast` (sonner), auto-dismiss | - |
| Inline colored buttons via `style="background:#RENKKODU !important;..."` hack (needed because ZK's `iceblue` theme fights inline `background-color`) | Normal shadcn `Button` `variant` prop, no CSS hacks needed | This entire inline-style workaround was a ZK-theme-specific problem. It does not exist in the new stack - use semantic button variants (`default`/`destructive`/`outline`/`secondary`) mapped to the design-system color tokens instead of copying any hex codes from the old `.zul` files. |
| Row-level status-dependent button visibility (`visible="@load(each.durum eq 'BEKLEMEDE')")`) | Conditionally render the relevant action button in the right detail panel based on `selectedRecord.durum`, disable/hide others | The underlying business rule (only certain statuses allow certain actions) must be preserved exactly - re-derive the same condition in the React component, and also rely on the backend's `IllegalStateException` as the source of truth/safety net if the UI condition is ever wrong or stale. |

## Master/detail and layout containers

| ZK widget | React equivalent | Notes |
|---|---|---|
| `<borderlayout>` with `<north>`/`<west>`/`<center>` | The global app shell: top bar (`north`), left nav (`west`), `<Outlet/>` content area (`center`) - built once, shared by every route | Do not rebuild this per-screen; it's the persistent shell described in design-system.md. |
| `<tabbox>` used for VS-Code-style multi-document tabs in `index.zul` | React Router routes/URLs replace this entirely | Each old "tab" becomes a real URL (`/collateral/transfers`, `/credit/optimization`, etc.) - this is a deliberate improvement (bookmarkable, shareable, browser back/forward works), not a like-for-like copy. Confirm with the user only if they express a strong preference to keep a tabbed-workspace feel; default to normal routed pages per screen. |
| `<hbox spacing="10px">` action button rows | Tailwind `flex gap-*` utility rows | Keep grouping/order of buttons the same for muscle-memory continuity for existing users. |
| `<separator>` | `<Separator />` (shadcn) or a `border-t border-[--border]` div | - |
| `<window apply="org.zkoss.bind.BindComposer" viewModel="...">` root | A React page component (e.g. `CollateralApprovalPage.tsx`) rendered at its route, using TanStack Query hooks instead of ZK's `@Init`/`@Command`/`@NotifyChange` binding | `@Init` -> `useQuery` initial fetch; `@Command` -> `useMutation`; `@NotifyChange` -> React state update + automatic re-render (no manual notify needed, this is one of the simplifications of moving off ZK's binding system). |

## Things that have NO React equivalent needed (ZK-only workarounds to leave behind)

- `SpringContextHolder.getBean()` - irrelevant, React components call REST
  endpoints over HTTP, no in-process bean lookup exists or is needed.
- ZK `variable-resolver` XML config / the associated harmless startup
  error log - purely a ZK/Spring wiring quirk, does not exist in the new
  stack.
- The `background` (shorthand) + `!important` + `text-shadow:none
  !important` CSS override pattern - was needed only to fight ZK's
  `iceblue` theme's `.z-button` default styles. Tailwind/shadcn components
  have no equivalent theme conflict; use plain component variants.
