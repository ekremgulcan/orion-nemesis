# Orion v3 Nemesis - Session Memory

## Archived Summary (2026-08-03 - 2026-08-14)

Built, in order, on top of `main`: "Bildirim Izleme" (ZK+React, project's
first paginated REST + first real Apache POI `.xlsx` export, V31-V33),
"Musteri Bildirim Tercihleri" v1 per-notification-type (V34/V35, first
"musteri no arama" infra: `CustomerService.bulByMusteriNo`, macros
`musteri-sorgulama-kutusu`/`musteri-bilgi-paneli`), a shared
`common/groupbox-polish.css` applied project-wide via `index.zul`, and
"Bildirim Ayarlari" (V36-V39, per-channel template settings) - all
merged into `main` with full Puppeteer regression suites. Durable
gotchas from this period: never edit an already-applied Flyway migration
(add a new one); ZK `<tabbox>` pre-renders ALL tabpanels' listbox rows at
once; ZK's `@command` on a nested `onClick` does NOT stop bubbling to an
ancestor's `onClick` (one row-level handler only); ZK native `<n:>`
elements don't evaluate `@load`/`@bind` on `style`/`visible` (use a real
`<div>` instead - and `visible="@load(...)"` on `<n:>` actually THROWS,
doesn't just no-op); `<?link>` doesn't propagate through `<include>`
(link shared CSS once in `index.zul` only); Spring's static-resource
cache needs `cache:false`/`cache.period:0` during dev; `<caption>`'s
non-label children get DESTROYED (not hidden) on re-render (move buttons
outside as siblings); numeric inputs need `onBlur`-time validation, not
live (`Number("") === 0` bug pattern); base-ui `<Select>` pre-renders all
options (bounding-box filter needed in shared test helpers); user
restarts the backend themselves, don't run `mvn`/`spring-boot:run`
without asking; backend runs JDK 21 in practice.

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

**[2026-08-19]** Rewrote both `musteri-bildirim-tercihleri-guncelleme.cjs`
regression suites (zk+react) for the category-row shape (11/11 green
each), then renamed 4 notification DTOs for full-English consistency
(`NotifKategoriDto`->`NotifCategoryDto`,
`NotifKanalKoduDto`->`NotifChannelCodeDto`,
`NotifKanalDurumuDto`->`NotifChannelStatusDto`,
`NotifBildirimTipiDto`->`NotifTypeSummaryDto` - class names only, methods/
variables stay Turkish per user's choice), verified zero old-name
references + clean build + suites still green, committed as `71f4882`
and fast-forward merged into `main`. Confirmed `notif_channel_templates`
id=4/5 are the user's OWN intentional clamp-boundary test data, not
residue - never reset these without being asked again.

## [2026-08-21] Repo split into fork+personal-origin, fixed a stale-`target/` Flyway version collision

**Yapilanlar:**
- User (not the repo owner) finished splitting remotes themselves:
  `origin` -> own new GitHub repo (`ekremgulcan/orion-nemesis`),
  `upstream` -> the real owner's repo (`mufasa-349/Orion-V3-Nemesis`).
  Going forward: push work to `origin`, periodically
  `git fetch upstream && git merge upstream/main` to pull the owner's
  new features.
- Owner had added investor-feature migrations at `V31-V33`, colliding
  with this project's own pre-existing notification migrations at the
  same versions. User resolved by renumbering the owner's investor
  files to `V42__investor_schema.sql`/`V43__seed_investor.sql`/
  `V44__seed_investor_fill.sql` in `src/main/resources/db/migration`
  (source itself was already clean, no duplicates).
- `mvn spring-boot:run` still failed with Flyway
  `Found more than one migration with version 31` pointing at
  `target/classes/db/migration` (NOT `src`). Root cause: Maven doesn't
  delete renamed/removed source files from `target/classes` on
  incremental builds - the OLD `V31__investor_schema.sql`/
  `V32__seed_investor.sql`/`V33__seed_investor_fill.sql` were stale
  leftovers from a build prior to the renumbering, sitting next to the
  real `V31__notification_event_schema.sql` etc. Fixed with
  `mvn clean` (wiped `target/` entirely) then reran - confirmed working
  by the user.

**Dikkat / Gotcha:**
- Any time a Flyway/resource file under `src/main/resources` is
  renamed or deleted, run `mvn clean` before the next
  build/`spring-boot:run` - `target/classes` silently keeps orphaned
  copies of the old filename, which for Flyway migrations manifests as
  a false "duplicate version" error that doesn't exist in source at
  all. Always check `target/classes/db/migration` (not just `src`)
  when this specific Flyway error shows up.

**Sonraki adimlar:**
- Same 3 items as the 2026-08-19 entry above still apply (push timing,
  branch cleanup, id=4/5 test data) - nothing new blocking.

## [2026-08-21] New "Hisse Risk Parametreleri" ZK screen built (branch `hisse-risk-parametreleri`), bulk-update page next

**Yapilanlar:**
- New feature branch `hisse-risk-parametreleri` off `main`. Goal chain
  (user's real target is #3, built in order as prerequisites):
  1. "Risk profilleri" search screen (Musteri No/Hesap No/Kullanici Tipi
     + results table, row click -> detail).
  2. "Risk Profili Guncelleme" detail/edit form (5 identity fields
     read-only when editing an existing row; ALL fields editable/unlocked
     in "Yeni Ekle" create mode, per user's explicit choice).
  3. (in progress, not started yet) "Net Varlik Limit Carpani Toplu
     Guncelleme" - Excel upload -> preview table -> Onaya Gonder bulk
     updates that field for every hisse_risk_parametreleri row sharing a
     Hesap No (both Musteri + Yatirim Danismani rows).
- Built #1+#2 end-to-end: migrations `V45__hisse_risk_parametreleri_schema.sql`
  (new table, deliberately separate from existing `risk_profiles` - field
  set too different: tri-state control-type strings not booleans, numeric
  limits, the new multiplier) + `V46__seed_hisse_risk_parametreleri.sql`;
  `com.orion.risk.domain.HisseRiskParametresi` entity +
  `HisseRiskParametresiRepository` + new dedicated
  `HisseRiskParametreleriService` (NOT bolted onto the already-4-purpose
  `RiskProfileService`) + `HisseRiskParametreleriViewModel` +
  `webapp/risk/hisse-risk-parametreleri.zul`. Menu: `MenuRegistry`'s
  existing standalone `"Yeni Hisse Emir Yonetimi"` item (pointed at an old,
  much simpler placeholder screen `risk/risk-parametreleri.zul` - left
  untouched/unlinked, not deleted) restructured into a parent with
  children, absorbing 3 previously-standalone sibling menu items
  (`Hisse Grubu Tanimlama`, `Hesap/Hisse Bazinda Kontrol`, `Hesap Durdurma
  Kurallari`) plus the new real screen and several `null` placeholders.
- Skipped building a REST/DTO layer entirely for this feature (unlike
  every prior feature) - user confirmed the supervisor only needs the ZK
  `.zul` + ViewModel + Service (backend here is a disposable mock; the
  supervisor plugs the frontend into their own real services). Also
  skipped a "Tarihce" (history) button per user's call (avoid decorative
  unbound buttons, a pattern this codebase already treats as a bug).
- Real back-and-forth corrections applied (all resolved before/during
  build, not left as TODOs): "Hesap Tipi" ended up NOT needing its own
  column - confirmed via seed data (`V43`/`V44`) that `accounts.hesap_musteri_tipi`
  already holds exactly `'Musteri'`, matching the screenshot, so it's
  read live off `Account` instead of duplicated; only the `A` group
  carries the "kredisiz" (margin-free) prefix, B/C/D are plain groups
  (fixed a wrong first-draft column/field naming); the screen's "Musteri
  Tipi" search filter is actually filtering the `Kullanici Tipi` column
  (Musteri/Yatirim Danismani), NOT the customer's BIREYSEL/KURUMSAL
  classification - caught and fixed across repository/service/VM/zul
  after initial wrong assumption.
- User will hand the ZK code to their supervisor to reimplement against
  a real backend - column names / DB naming genuinely don't matter for
  that handoff (confirmed: this whole project's other tables are already
  Turkish-named anyway), but the ViewModel + zul need to be the clean,
  self-explanatory reference artifacts.

**Kararlar:**
- Old `risk_profiles` table/`risk-parametreleri.zul`/its own React port
  (`nemesis-frontend/src/pages/risk/RiskParametreleriPage.tsx`) intentionally
  NOT touched/replaced - `RiskProfileService` is shared across 4 unrelated
  concerns (RiskProfile/UserLimit/InstrumentGroup/AccountInstrumentControl)
  so surgical removal is riskier than it looks, and it already has a
  working React consumer (would break the "ZK first" ordering). Revisit as
  its own follow-up later if ever needed.

**Dikkat / Gotcha:**
- Entity boolean fields named with a single leading lowercase letter
  before an uppercase one (e.g. original draft `bGrubuAlisYapabilir` at
  the very front) break Lombok/JavaBean getter capitalization
  expectations in a confusing way - renamed to the `grup_b_...` order
  (matching `risk_profiles`' own existing `grup_a_nakit_kontrol` naming
  precedent) instead, e.g. `grupBAlisYapabilir`. Avoid single-letter-first
  field names in general.
- `BindUtils.postNotifyChange` in this ZK version is NOT varargs for
  properties - only `(queueName, queueScope, bean, singleProperty)`;
  calling it once with 3 property-name args fails to compile. Call it
  once per property instead.
- PowerShell's `-replace` operator is case-INSENSITIVE by default (a
  `-replace 'aramaMusteriTipi', 'aramaKullaniciTipi'` mangled the
  differently-cased `getAramaMusteriTipi()`/`setAramaMusteriTipi()` method
  names into broken lowercase `getaramaKullaniciTipi()`). Use `-creplace`
  or the `Edit` tool (not a blind PowerShell regex) for case-sensitive
  identifier renames across a file.
- Hit a pre-existing, unrelated uncommitted change mid-session that broke
  the ENTIRE build with cascading "cannot find symbol" errors project-wide
  (`AccountInstrumentControlDto.java`'s class renamed to
  `ProAccountInstrumentControlDto` without renaming the file) - not caused
  by this session's work; user fixed it independently. Worth remembering:
  a single fatal "class name doesn't match file name" error can cascade
  into dozens of misleading unrelated-looking errors across the whole
  module in one `mvn compile` run.

**Degisen dosyalar:**
- `src/main/resources/db/migration/V45__hisse_risk_parametreleri_schema.sql`,
  `V46__seed_hisse_risk_parametreleri.sql` - new.
- `src/main/java/com/orion/risk/domain/HisseRiskParametresi.java`,
  `repository/HisseRiskParametresiRepository.java`,
  `service/HisseRiskParametreleriService.java`,
  `vm/HisseRiskParametreleriViewModel.java` - new.
- `src/main/webapp/risk/hisse-risk-parametreleri.zul` - new.
- `src/main/java/com/orion/nav/MenuRegistry.java` - restructured
  "Yeni Hisse Emir Yonetimi" into a parent with children.

**Sonraki adimlar:**
1. Build the bulk update page next (`net-varlik-limit-carpani-toplu-guncelleme.zul`
   + a new dedicated service, no new DB table needed - just updates the
   existing `net_varlik_limit_carpani` column). Plan already agreed with
   user: a button "Net Varlik Limit Carpani Toplu Guncelleme" on the
   Risk profilleri toolbar opens this as a brand NEW **outer** main tab
   (not an inner tab) via a new `@GlobalCommand openTab(baslik, zulPath)`
   on `IndexViewModel` + `BindUtils.postGlobalCommand(...)` from the child
   VM - this cross-VM-tab-opening mechanism does not exist yet anywhere
   in the codebase and was mid-edit (first edit to `IndexViewModel.java`
   was rejected by the user right as this session paused) - not started.
2. Excel parsing (Apache POI read side) is a first for this project -
   only the write/export side existed before (`NotificationEventService`).
3. `mvn compile` is currently clean on this branch (verified end of
   session).

## [2026-08-24] Built, fixed, and simplified the Net Varlik Limit Carpani Toplu Guncelleme bulk-update tab; committed the whole Hisse Risk Parametreleri feature

**Yapilanlar:**
- Corrected course on the "outer tab" plan from the 08-21 entry: user
  pushed back immediately (didn't recall ever agreeing to it, and the
  note itself self-contradicted - see Dikkat). Built as a 3rd INNER
  tab on the existing screen instead, no `IndexViewModel`/`OpenTab`
  changes at all.
- Built the bulk-update tab end-to-end:
  `HisseRiskParametreleriService.excelOnizle`/`topluGuncelle`/
  `topluGuncellemeSablonuOlustur` (project's first Apache POI READ
  path - only export/write existed before), new
  `NetVarlikCarpaniTopluSatir` row model, ViewModel state
  (`topluGuncellemeAcik`/`onizlemeSatirlari`/`onizlemeYapildi`) +
  commands, 3rd `<tabpanel>` in the `.zul` with a native
  `upload="true"` button.
- First-ever file-upload E2E test in this project: discovered ZK's
  `<button upload="true">` renders a real (invisibly clipped)
  `input[type=file]`, directly `.uploadFile()`-able via Puppeteer with
  no need to click the button first - documented in the skill's
  `dom-notes.md`. Added `xlsx` (SheetJS) as a test-automation
  devDependency to generate real `.xlsx` fixtures.
- User caught a real bug: uploading invalid data (out-of-range
  multiplier) let "Onaya Gonder" proceed and show a generic success
  message while silently updating nothing. Fixed with a derived
  `isOnizlemeTumuGecerli()` getter gating the button (`disabled`) + a
  server-side re-check in `onayaGonder`. Hit (and fixed) a real ZK
  gotcha along the way, see Dikkat.
- Walked the user through the entire stack twice: once for this
  feature (DB dummy data + domain/repo/service/vm/zul), once
  contrasting it against the OLDER `risk_profiles` module's full
  REST/DTO/Controller/React stack - confirmed via reading
  `HisseGrubuViewModel` that ZK ViewModels call services DIRECTLY
  (`SpringContextHolder.getBean`) and never go through their own
  module's REST controller, even when one exists right next to them.
- User feedback simplified the preview table: dropped Musteri
  No/Musteri Adi/Kullanici Tipi columns entirely, collapsed to ONE
  preview row per Hesap No (was one row per Musteri+Yatirim
  Danismani record) - `NetVarlikCarpaniTopluSatir.parametreId` became
  `parametreIdListesi` so one row can still drive multiple underlying
  record updates.
- Committed everything as a single commit (`f221450`) on the
  `hisse-risk-parametreleri` branch (not merged/pushed).

**Dikkat / Gotcha:**
- ZK's `@NotifyChange` does NOT auto-track derived-getter
  dependencies - a `@load(vm.someDerivedBoolean)` binding will NOT
  refresh just because the fields it reads from were notified. Every
  `@NotifyChange` list touching `onizlemeSatirlari` had to explicitly
  also list the derived getter's own bean-property name
  (`onizlemeTumuGecerli`), or the binding silently stays frozen at its
  initial value forever (this exact bug shipped once and passed a
  test for the wrong reason - the "disabled" button happened to start
  `true` and never change, so an invalid-data test looked like it
  passed before the real mechanism was actually working).
- This file's own 08-21 entry contained a self-contradiction ("plan
  already agreed with user" immediately followed by "rejected by
  user"). When relaying a past-session plan forward, sanity-check it
  against that same entry's own later lines before repeating it as
  settled.

**Degisen dosyalar:**
- `src/main/java/com/orion/risk/vm/NetVarlikCarpaniTopluSatir.java` -
  new row model (later simplified: id -> id-list, dropped 3 display
  fields).
- `src/main/java/com/orion/risk/service/HisseRiskParametreleriService.java` -
  added `excelOnizle`/`topluGuncelle`/`topluGuncellemeSablonuOlustur`
  + POI cell-reading helpers.
- `src/main/java/com/orion/risk/vm/HisseRiskParametreleriViewModel.java` -
  tab-3 state/commands + `isOnizlemeTumuGecerli` validation gate.
- `src/main/webapp/risk/hisse-risk-parametreleri.zul` - 3rd tab,
  upload button, preview listbox (4 columns).
- `test-automation/screens/zk/net-varlik-limit-carpani-toplu-guncelleme{,-gecersiz-veri}.cjs` -
  new regression scripts (happy path + invalid-data blocking), both
  green.
- `test-automation/package.json` - added `xlsx` devDependency.
- Committed as `f221450` on `hisse-risk-parametreleri`.

**Sonraki adimlar:**
1. Feature is functionally complete and committed on the branch - not
   yet merged into `main`, not pushed to `origin`. User to decide
   timing.
2. Same standing items as before still apply: `notif_channel_templates`
   id=4/5 are the user's own test data (don't touch), local `main`
   still ahead of `origin/main`.

## [2026-08-26] Migrated Hisse Risk Parametreleri to React (REST + page), wrote its Puppeteer regression test, committed

**Yapilanlar:**
- Full ZK->REST->React migration on the same `hisse-risk-parametreleri`
  branch: new DTOs/mapper/`HisseRiskParametreleriController` under
  `/api/v1/risk/hisse-risk-parametreleri` (search/CRUD, Excel export,
  account lookup "Bul", and the bulk-update flow - multipart preview +
  stateless confirm + template download, project's first multipart
  file-upload REST endpoint, added `spring.servlet.multipart` limits to
  `application.yml`). All reused `HisseRiskParametreleriService` as-is.
- New `HisseRiskParametreleriPage.tsx`: 3-column layout (search+17-col
  table in middle, create/edit detail form in `DetailAside` on the
  right, identity fields locked in edit mode/unlocked in create mode
  exactly matching ZK); bulk-update Excel workflow built as its own
  `Dialog` (a genuinely separate multi-step flow, not a record detail).
  Restructured `menu-registry.ts`'s "Yeni Hisse Emir Yonetimi" into a
  parent+8-children tree to mirror the real `MenuRegistry.java` (old
  `RiskParametreleriPage`/`/risk/risk-parametreleri` route kept but
  unlinked from nav, matching the ZK side's own precedent); `App.tsx`
  now recursively flattens the menu tree so nested unimplemented
  children still get a `PlaceholderPage` route.
- Verified the whole backend surface with real `curl`/`Invoke-RestMethod`
  calls against the real DB after the user restarted the backend: list/
  search, account lookup (incl. the exact ZK error message on a 400),
  export + template `.xlsx` downloads, a full multipart preview ->
  confirm bulk-update round trip (2 linked Musteri+Yatirim Danismani
  rows updated together), and a full create/update/delete CRUD cycle -
  all correct, all cleaned up after.
- Wrote `test-automation/screens/react/hisse-risk-parametreleri-kayit-yasam-dongusu.cjs`
  (create -> edit -> delete lifecycle on hesapNo=10002, which starts
  with zero existing rows). Along the way, found and fixed a real bug
  in the SHARED `react.js#waitForToast` helper (not app code): two
  different actions in this app can render the literal same toast text
  ("... kaydedildi." for both create and edit), and toasts linger ~4s,
  so a create->edit->delete run in quick succession could read a STALE
  toast instead of the new one. Fixed by having `waitForToast` mark
  every toast already present at call time and wait for one WITHOUT
  that marker - robust regardless of text/DOM order. User caught the
  suspicious "toast not seen" FAIL live in the UI and confirmed the
  real toast was actually showing, confirming it was a script bug.
  19/19 steps green after the fix.
- Committed both the migration and the test fix together as `a607fe7`
  on `hisse-risk-parametreleri` (on top of the existing `f221450`).

**Dikkat / Gotcha:**
- shadcn `<AlertDialog>` renders via a React Portal appended at the end
  of `<body>` - if the same label (e.g. "Sil") also exists as a trigger
  button elsewhere on the page, whole-page `clickButtonByText` grabs
  the wrong (first-in-DOM) one. Added `clickButtonByTextWithin(page,
  '[role="alertdialog"]', text)` to `react.js` for this.
- `react.js#waitForToast` gotcha above - see Yapilanlar; documented in
  the test-automation skill's `dom-notes.md`.
- My own form has a live (harmless) Base UI console warning about a
  `Select` switching controlled/uncontrolled state
  (`HisseRiskParametreleriPage.tsx`) - flagged to user, not fixed yet,
  their call whether to bother.

**Degisen dosyalar:**
- `src/main/java/com/orion/risk/{dto/*,controller/HisseRiskParametreleriController.java}` -
  new REST layer (7 new files).
- `nemesis-frontend/src/api/hisseRiskParametreleri.ts`,
  `nemesis-frontend/src/pages/risk/HisseRiskParametreleriPage.tsx` - new.
- `nemesis-frontend/src/{App.tsx,nav/menu-registry.ts}` - route +
  nav-tree restructure.
- `src/main/resources/application.yml` - multipart size limits.
- `test-automation/helpers/react.js` - `waitForToast` fix +
  `clickButtonByTextWithin` added.
- `test-automation/screens/react/hisse-risk-parametreleri-kayit-yasam-dongusu.cjs` -
  new, 19/19 green.
- Committed as `a607fe7` on `hisse-risk-parametreleri`.

**Sonraki adimlar:**
1. Branch has 2 commits (`f221450`, `a607fe7`) - still not merged into
   `main`, not pushed to `origin`. User to decide timing.
2. Bulk-update Excel dialog (React side) has no regression test yet -
   only the main CRUD lifecycle is covered; ZK side already has both
   (happy path + invalid-data) for that specific tab.
3. Same standing items still apply: `notif_channel_templates` id=4/5
   are the user's own test data (don't touch), local `main` still
   ahead of `origin/main`.
