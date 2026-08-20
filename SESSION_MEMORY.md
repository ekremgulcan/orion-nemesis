# Orion v3 Nemesis - Session Memory

## Archived Summary (2026-08-03 - 2026-08-04)

**[2026-08-03]** Built "Bildirim Izleme" screen end-to-end (ZK + React) -
project's first paginated (`Page<T>`) REST endpoint + first real Apache
POI `.xlsx` export, new `com.orion.notification` package, migrations
V31-V33. Wrote first 2 permanent Puppeteer regression scripts
(`bildirim-izleme-filtreleme.cjs` x2). Committed on `bildirim-izleme`
branch (not merged). Key gotchas: ZK `<hbox>` isn't real flexbox (use
native `<n:div>`), ZK combobox popup opens via the sibling
`.z-combobox-button` not the input, a `<tabbox>` pre-renders ALL
tabpanels' listbox rows in the DOM at once (need `getVisibleGridRows`),
never edit an already-applied Flyway migration (add a new one instead).

**[2026-08-04]** Fixed Bildirim Izleme's default date filter (was
today/today, went stale after a day) and a real pagination bug
(`SQLServerDialect` -> `SQLServer2012Dialect`, first `Page<T>` endpoint
to hit real OFFSET). Built generic submenu (expand/collapse) support for
the left nav on both ZK and React (`MenuItem.children`), nested Bildirim
Izleme under Musteri Iletisim Panosu for real. Key gotcha: ZK's
`@command` binding on a nested element's `onClick` does NOT stop bubbling
to an ancestor `listitem`'s own `onClick` - use ONE row-level handler for
navigate+toggle, never a separate arrow-only handler (they double-fire
and cancel out). Also: editing a `<template name="...">` block without
re-including the opening tag leaves an orphaned closing tag -> fatal
SAXParseException (500 on every page).

**[2026-08-05]** Bildirim Izleme UI polish (React tab style + table-fixed
dynamic-width), 30-step comprehensive Puppeteer suite
(`bildirim-izleme-kapsamli-testi.cjs`), fixed 2 real test-helper bugs
(`getTableRows` counting empty-state row, date-input click landing on
wrong segment - see gotcha below). Test-drove an Orion-specific
`orion-excel-export` skill end-to-end then deleted it in favor of a
generalized, stack-agnostic `excel-export-button` skill (personal +
`agent-skills/` showcase copy) since personal skills apply across every
project. Fixed export filename inconsistency (`events-yyyyMMdd.xlsx`
everywhere). Merged `bildirim-izleme` into `main` (clean fast-forward).
Key gotchas: PowerShell `Copy-Item -LiteralPath` doesn't support
wildcards (use `-Path`); Puppeteer clicks on native `<input type=date>`
should land near the left edge (`box.x + 10`), not center, since the
calendar icon shifts the real segment position.

**[2026-08-06]** Built "Musteri Bildirim Tercihleri" screen (ZK + React,
branch `musteri-bildirim-tercihleri` off `main`) - musteri no ara -> bildirim
tipi x Push/SMS/E-Posta kanal tercihleri, VIOP Margin Call zorunlu/kilitli.
New `com.orion.notification` domain (`NotificationType`/`MusteriBildirimTercihi`,
V34/V35 migrations, 6 seeded types), `MusteriBildirimTercihleriService` shared
by ZK VM + REST. First reusable "musteri no arama" infra built from scratch
(`CustomerService.bulByMusteriNo`, ZK inline macros `musteri-sorgulama-kutusu`/
`musteri-bilgi-paneli`, React `CustomerLookupCard`/`CustomerSummaryCard`).
Key gotchas: ZK native `<n:>` components don't evaluate `@load`/`@bind` on
`style`/`visible` (use real `<div visible="@load(...)">` instead); `iconSclass`
Font-Awesome icons only render on Button/Toolbarbutton/Tab, use plain Unicode
glyphs elsewhere; `@base-ui/react` (not radix) is this project's headless
primitive lib; JDK 17 lives at `%USERPROFILE%\.jdks\ms-17.0.20` on this machine.

**[2026-08-07]** Wrote first comprehensive Puppeteer suite for Musteri
Bildirim Tercihleri (11 steps, both ZK+React, `musteri-bildirim-tercihleri-guncelleme.cjs`),
added `setCheckboxByIndex`/`setSwitchByIndex` helpers (ZK toggle = real
checkbox, React base-ui Switch = `<span role="switch">`, not a checkbox).
Iterative UI polish with user: fixed the page being the only screen using a
solid `bg-info` banner header (restyled to app's plain `border-b` convention),
fixed a `max-w-4xl`-centered layout bug (final: search+summary cards
side-by-side, `flex h-full` stretch), enlarged `CustomerSummaryCard` fields
and `musteri-bilgi-paneli.zul` padding per real Orion reference screenshots.
Committed as `d06669c`. Gotcha: testing ZK "fits without scroll" via a bare
`.zul` URL undercounts real chrome height by 100px+ - must navigate through
`index.zul`'s real menu/tabbox to measure correctly.

**[2026-08-10]** ZK-wide groupbox consistency pass: converted Musteri
Bildirim Tercihleri's custom bordered cards to real `<groupbox>/<caption>`,
then built a shared `common/groupbox-polish.css` (solid `#2f6fad` banner
skin) applied to ALL ~12 groupbox-using screens via a single `<link>` in
`index.zul` (committed on `musteri-bildirim-tercihleri`, commit `1507d46`,
11/11 regression). Key gotchas: `<?link>` does NOT propagate through
`<include src="...">` (must link shared CSS once in `index.zul` itself,
not per-screen); Spring's `spring.web.resources.chain.cache` caches the
FIRST successful static-resource read forever until restart (fixed via
`cache: false` + `cache.period: 0`); ZK's iceblue theme beats single-class
CSS overrides with its own compound-class selectors (needed `!important`,
documented as an intentional isolated exception); native `<n:div>` inside
`<groupbox>` gets zero horizontal padding by default, unlike real ZK
widgets. Backend actually runs JDK 21 in practice despite earlier JDK 17
note; user restarts the backend themselves, don't run `mvn compile`/
`spring-boot:run` without asking.

**[2026-08-11]** Merged `musteri-bildirim-tercihleri` into `main`. Planned
new "Bildirim Ayarlari" screen from a real mockup + 2 production JSON
payloads; reused the existing `NotificationType`/`notification_types` table
(avoided a duplicate-table design mistake) instead of a new `NotifType`
table. Reconciled 6 seeded codes against 7 real codes, invented
`STATUS_CHANGED` and added a new `PARTIALLY_FILLED` row (later found wrong,
fixed 08-13). Migration `V36` adds `active`/audit columns to
`notification_types` (7 rows). Gotcha: SQL Server rejects a whole Flyway
batch if `ALTER TABLE ADD col` and a later statement referencing that col
share a batch with no `GO` between them - split with `GO`. Branch
`bildirim-ayarlari` created off `main`, not yet committed at end of session.

**[2026-08-12]** Built Bildirim Ayarlari screen end-to-end (ZK+React) for
steps 1-2 only: `BildirimAyarlariService`/`ViewModel`, `bildirim-ayarlari.zul`,
new `BildirimKanali` enum (`PUSH`/`SMS`/`EPOSTA`), REST layer +
`BildirimAyarlariPage.tsx`, both wired into menu. Wrote 9-step regression
suites for both stacks (9/9 green), committed as `7f96892`. Gotchas: ZK
Comboitem labels bound from Java render regular spaces as `\u00A0`
(normalize in test helpers); `document.body.innerText` excludes `<input>`
values (use `getComboboxValues` instead); base-ui `Select.Value` doesn't
auto-resolve a label, needs a render-function child.

**[2026-08-13]** Built Bildirim Ayarlari's per-channel section (ZK+React)
end to end from real production JSON: `V37` fixed an earlier invented
`STATUS_CHANGED`/`PARTIALLY_FILLED` split (renamed to match real prod
data, `notification_types` back to 6 real rows), `V38` added
`notif_channel_templates` (18 seeded rows, 6 types x 3 channels).
Built "Sablonda Kullanilabilecek Parametreler"/"Mevcut Sablon"/"Diger
Ayarlar" panels + Duzenle/Iptal/Kaydet trio; deleted a buggy per-field
edit-buffer pattern in favor of direct entity mutation (buffer/entity
desync caused 3 real bugs). Extended regression suites 9->15 steps,
committed `21fec94`. Key gotchas: ZK inline `style="display:..."` fights
a `visible` binding on the same element (never combine them); `<caption>`
non-label children get DESTROYED (not hidden) when the caption's own
label re-renders (move buttons outside as absolutely-positioned
siblings); a getter missing from `@NotifyChange` freezes at its first
value forever; Flyway's `${...}` placeholder parsing collides with
literal `${Param}` template text (`spring.flyway.placeholder-replacement: false`);
base-ui `<Select>` pre-renders every option into the DOM (shared test
helper needed a bounding-box filter to avoid clicking a same-labeled
but invisible option from a different select).

**[2026-08-14]** Two sessions: (1) renamed `BildirimKanali.PUSH`'s
display label "Mobil"->"Push" across ZK+React+6 test scripts, no
migration needed (only the enum NAME is persisted). (2) Verified and
committed the previously-uncommitted `V39` (allowed-parametreler) work,
disproved a suspected ZK clamp bug (was test timing flakiness, not a
real defect - confirmed via bytecode inspection + repeat runs), and
fixed a real React bug: numeric inputs (`Max Deneme Sayisi`/`Tekrar
Deneme Suresi`) force-filled `0` and blocked retyping because
`Number("") === 0` not `NaN`; fixed by validating `onBlur` (matching
ZK's own blur-commit `<intbox>`) with local raw-text state during
editing - general pattern for any future numeric input on this project.
Committed everything as `18e8abb`. Flagged 3 dirty leftover test-data
rows in `notif_channel_templates` (clamp-boundary residue), left
unresolved by choice (DB state, not code).

## Archived Summary (2026-08-17 - 2026-08-18)

**[2026-08-17 -> 08-18]** Musteri Bildirim Tercihleri reworked from
per-notification-type to per-CATEGORY preferences, for strict parity
with a real service doc (`musteri_bildirim_tercihleri_servis_dokumani.docx`,
extracted by copying the Word-locked file then `Expand-Archive`'ing it
as a zip). New `notification_categories` table (`ORDER_STATUS`/
`VIOP_MARGIN_CALL`) with 4 independent editable flags (category-level
`is_editable` = UI/mobile-visibility rule vs. per-channel
`push/sms/eposta_editable` = business rule - confirmed NOT
derived-from-each-other via the doc's own example); `customers.username`
added (doc keys everything off `username`, not `musteri_no`) with a
verified-unique backfill formula; old per-type
`musteri_bildirim_tercihleri` table dropped outright (mock data only,
no collapse logic needed) and replaced by
`musteri_bildirim_kategori_tercihleri`. New strict-parity DTOs/REST
endpoints (`/api/v1/notification/notifPreferences/{getAll,update}`,
kept the module's shared prefix over the doc's bare path) with
independent per-channel update results
(`SUCCESS`/`FAILED`)/overall (`SUCCESS`/`PARTIAL_SUCCESS`/`FAIL`)
status. ZK (`musteri-bildirim-tercihleri.zul`/ViewModel/new
`KategoriSatiri` flattened row model) and React
(`MusteriBildirimTercihleriPage.tsx`) both rewritten, sharing one
`MusteriBildirimTercihleriService`; React deliberately dropped "Son
Guncelleme" (no such field in the strict-parity response) and is
stricter than ZK about surfacing `PARTIAL_SUCCESS`/`FAIL` in its save
toast (ZK's `Clients.showNotification` is unconditionally "success").
Key gotchas hit: a Javadoc comment containing a literal `*/` mid-prose
silently corrupts the whole comment block into invalid Java (cascading,
misleading compiler errors on unrelated lines - worth a `\w\*/\w` regex
sweep on any big Javadoc-heavy batch); `visible="@load(...)"` on a
native ZK `<n:>` tag isn't just silently ignored, it THROWS
`UnsupportedOperationException` at render time (fatal, not the "just
doesn't bind" gotcha documented earlier - use a real `<span>` instead).
Branch `musteri-bildirim-tercihleri-kategori-rework` created off `main`,
backend+ZK+React all verified working (real DB smoke tests +
screenshot-verified), but left uncommitted at the end of 08-18 pending
regression-suite rewrites.

## [2026-08-19] Rewrote both regression suites for the category rework, renamed 4 DTOs for consistent English naming, committed, and merged into `main`

**Yapilanlar:**
- Environment restart mishap (self-inflicted, corrected): asked user
  whether to start backend/frontend myself, user said yes; both were
  actually already running from before - my `mvn spring-boot:run`
  failed harmlessly ("port already in use"), but my `npm run dev`
  started a real duplicate dev server on `:5174` which I found and
  killed. No lasting side effects, but should have checked running
  processes BEFORE offering to start anything.
- Rewrote both `musteri-bildirim-tercihleri-guncelleme.cjs` suites
  (zk+react) for the new 2-category-row shape (6 checkboxes/switches
  total, not 18; `VIOP_MARGIN_CALL` = index 3-5 locked instead of the
  old 6th-type row; DB check now joins
  `musteri_bildirim_kategori_tercihleri`+`notification_categories` on
  `kod='ORDER_STATUS'`). Both 11/11 green against real DB data
  (`M000005`/`mustafa.ozturk.005`), teardown confirmed clean.
- Explained the full stack to the user in detail (tables w/ real dummy
  data, services, live JSON responses via direct `Invoke-RestMethod`
  calls showing a real `PARTIAL_SUCCESS` mixed-update example, ZK
  `.zul`/ViewModel/macro-component internals) - no code changes from
  this, purely walkthrough.
- User flagged inconsistent DTO naming (English `Notif` prefix + Turkish
  body + English `Dto` suffix). Renamed all 4 for full-English
  consistency: `NotifKategoriDto`->`NotifCategoryDto`,
  `NotifKanalKoduDto`->`NotifChannelCodeDto`,
  `NotifKanalDurumuDto`->`NotifChannelStatusDto`,
  `NotifBildirimTipiDto`->`NotifTypeSummaryDto` (kept the `Notif`
  prefix + method/variable names as-is - only the class names were in
  scope, per the user's explicit choice among 3 offered options).
  Verified via grep zero old-name references remain (Java+TS), frontend
  `npm run build` clean, both regression suites re-run green after the
  rename (one transient double-FAIL mid-rename was Vite HMR reloading
  the live-served files at the exact moment I edited them - confirmed
  as flakiness by re-running, not a real regression).
- Corrected a wrong assumption: I had flagged 2 rows in
  `notif_channel_templates` (`GDT_FILLED`/PUSH at `max_retry=0`,
  `error_backoff_time=86400`; `GDT_FILLED`/SMS at `max_retry=20`) as
  "dirty leftover test residue" needing cleanup - user clarified these
  are their OWN intentional manual test values (clamp-boundary
  testing), not residue. Left untouched, not our data to "fix".
- Committed the whole rework as a single commit (`71f4882`) on the
  feature branch, then fast-forward merged into local `main` (no
  conflicts, `main` hadn't moved since the branch was cut).

**Kararlar:**
- DTO rename scope = class names only (not method/variable names like
  `toKategoriDto`/`kanalKodu`, which stay Turkish, matching the rest of
  the codebase's Turkish method/variable convention) - user picked
  "fully English" for the 4 flagged classes specifically, not a
  project-wide Turkish/English cleanup.

**Degisen dosyalar:**
- `test-automation/screens/{zk,react}/musteri-bildirim-tercihleri-guncelleme.cjs` -
  rewritten for category-row shape.
- `src/main/java/com/orion/notification/dto/{NotifCategoryDto,NotifChannelCodeDto,NotifChannelStatusDto,NotifTypeSummaryDto}.java` -
  renamed (`git mv`) from their old Turkish-mixed names.
- Every file referencing those 4 DTOs updated (service, ViewModel,
  `notificationPreferences.ts`, `MusteriBildirimTercihleriPage.tsx`).

**Sonraki adimlar:**
1. Local `main` is 17 commits ahead of `origin/main`, still not pushed -
   user to decide when to push.
2. Feature branch `musteri-bildirim-tercihleri-kategori-rework` is fully
   merged, safe to delete once user confirms.
3. `notif_channel_templates` id=4/id=5 are the user's OWN intentional
   test data (see Kararlar/Gotcha above) - do NOT reset these without
   being asked again.
