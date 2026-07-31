---
name: orion-screen-migration
description: Use when migrating a screen from the Orion v3 Nemesis ZK7/Spring Boot back-office platform to the new React frontend (nemesis-frontend). Triggers on requests like "bu ekranı react'e çevir", "şu zul ekranını taşı", "ekran dönüşümü yap", "nemesis-frontend'e taşı", "convert this ZK screen to React", "migrate this screen". Covers the full pipeline: extracting business logic from the existing ZK ViewModel/Service pair, exposing it safely via a new REST/DTO layer without breaking the existing ZK screens or database schema, and building the equivalent React page using the Orion dark-theme 3-column design system with Gestalt-based layout principles.
---

# Orion Screen Migration (ZK7 -> React)

You are migrating one screen at a time from the legacy ZK7 UI
(`src/main/webapp/**/*.zul` + matching `vm/*ViewModel.java`) to the new
React frontend living in `nemesis-frontend/` inside the same repo. The
legacy ZK screens **must keep working unmodified** throughout this
migration - this is a parallel, incremental migration, not a rewrite.
Never delete or break a `.zul` screen unless the user explicitly asks you
to retire it.

Read `references/backend-integration.md` before touching any Java file -
it documents project-specific traps (dual Flyway migration folders,
`SpringContextHolder` wiring, lazy-loading rules) that have caused real
bugs in this codebase before.

Read `references/design-system.md` before writing any React/CSS - it
defines the exact color tokens, typography, spacing and Gestalt rules to
use so every migrated screen looks consistent.

Read `references/zk-to-react-component-map.md` when translating specific
ZK widgets (`listbox`, `combobox`, `checkbox-listbox`, `datebox`,
`Messagebox`, tab-based master/detail) into their React/shadcn
equivalents.

Read `references/data-visualization.md` when a screen's data would
genuinely benefit from a chart or KPI strip (status distributions,
aggregate totals, rankings, time series) - it defines when to add one,
which library to use, and the exact color/placement rules so charts look
like part of the same trading-terminal UI, not a bolted-on dashboard
widget.

## Golden rules (never violate these)

1. **Never modify an existing `@Service` method's business logic just to
   make it "REST-friendly".** The service layer is already
   framework-agnostic (no ZK imports) - reuse it as-is from the new
   `@RestController`. If a service method truly needs a new variant
   (e.g. a paginated version), add a new method, don't rewrite the old
   one that the ZK ViewModel still calls.
2. **Never expose JPA entities directly as JSON.** Every REST response
   must go through a DTO + mapper (see backend-integration.md). Entities
   have lazy `@ManyToOne`/`@OneToMany` relations that will throw
   `LazyInitializationException` or produce infinite recursion if
   serialized directly.
3. **Never touch a Flyway migration file that has already been applied.**
   If schema changes are needed, create a new `V{next}__description.sql`
   file and copy it into BOTH `db/` (documentation copy) and
   `src/main/resources/db/migration/` (the actual Flyway classpath
   location Spring Boot reads). These two folders are kept in sync
   manually in this project - forgetting the second copy means the
   migration silently never runs.
4. **Never remove or rename an existing REST-unrelated file/route just to
   "clean up"** during a migration task. Scope is: read old screen ->
   add backend API -> build new React page. Nothing else.
5. **Always verify both sides still build** (`mvn -q compile` for
   backend, `npm run build` for `nemesis-frontend`) before declaring a
   screen migrated.
6. **Preserve every business rule and validation message** from the old
   ViewModel/Service, even the awkward-sounding Turkish ones (e.g.
   "Sadece BEKLEMEDE durumundaki talepler onaylanabilir") - these are
   real domain rules, translate them faithfully into the new API's error
   responses and the new UI's inline/toast messages.

## Step-by-step workflow for migrating one screen

### Phase 0 - Discovery (read-only, do this first every time)

1. Locate the `.zul` file and its bound ViewModel (`viewModel="@id('vm')
   @init('com.orion.<module>.vm.<Name>ViewModel')"`).
2. Read the ViewModel fully. List every:
   - `@Command` method (these become REST endpoints/mutations)
   - Bound property getter (these become the DTO/query shape)
   - `Messagebox` call and its trigger condition (these become API error
     responses + UI toast/dialog messages)
3. Read every `@Service` method the ViewModel calls. Note:
   - Which repository methods are used (especially any `findAllFetched()`
     / `search()` JOIN FETCH query - reuse these, don't write raw entity
     fetches)
   - Every `IllegalArgumentException`/`IllegalStateException` thrown and
     its message (these map 1:1 to HTTP 400/409 responses)
4. Note the screen's current visual structure (tabs, listbox columns,
   action buttons, forms) - this is the *content* you're re-arranging
   into the new 3-column layout, not a layout to copy pixel-for-pixel.
5. Summarize the above back to the user in a short list before writing
   any code, unless the screen is trivial (single list + no actions).

### Phase 1 - Backend: DTO + Mapper + REST controller

1. Create `src/main/java/com/orion/<module>/dto/<Name>Dto.java` (plain
   Java record or Lombok `@Getter/@Setter` class - match existing module
   style). Flatten every lazy relation the screen actually needs (e.g.
   `accountNo`, `customerName` as flat strings/numbers, not nested
   entity graphs) unless the screen genuinely needs a nested shape, in
   which case nest DTOs, never entities.
2. Add a mapper. If MapStruct is not yet a dependency, add it to
   `pom.xml` on the first backend migration task (see
   backend-integration.md for the exact dependency block). Otherwise add
   a `<Name>Mapper` interface next to the DTO.
3. Create `src/main/java/com/orion/<module>/controller/<Name>Controller.java`
   annotated `@RestController @RequestMapping("/api/v1/<module>")`.
   Inject the existing `@Service` via constructor (standard Spring
   `@Autowired`-free constructor injection, same as services already do
   - controllers are real Spring beans, unlike ZK ViewModels, so no
   `SpringContextHolder` needed here).
4. One endpoint per ViewModel capability:
   - List/search -> `GET /api/v1/<module>/<resource>?q=...`
   - Single action commands (`onayla`, `reddet`, `iptalEt`, etc.) ->
     `POST /api/v1/<module>/<resource>/{id}/<action-in-english>` (e.g.
     `onaylaVeTamamla` -> `POST .../{id}/approve`, `reddet` -> `.../{id}/reject`)
   - Creation forms -> `POST /api/v1/<module>/<resource>`
5. Add a `@RestControllerAdvice` (shared, create once under
   `com.orion.core.web.ApiExceptionHandler` if it doesn't exist yet) that
   maps `IllegalArgumentException`/`IllegalStateException` ->
   `400`/`409` with a JSON body `{ "message": "<original exception
   message>" }`. Reuse this for every module - don't create a new
   exception handler per controller.
6. If this is the first REST endpoint in the whole project, also do the
   one-time setup described in backend-integration.md (CORS config,
   Spring Security + JWT skeleton, `/api/**` path carve-out). Ask the
   user if this one-time setup hasn't been done yet and it's not obvious
   from the codebase - check first with a quick grep for
   `@RestController` and `SecurityConfig` before asking.
7. Compile (`mvn -q compile`), fix errors, then restart the backend and
   smoke-test the new endpoints with `curl` before moving to the frontend
   (auth header included once JWT is live).

### Phase 2 - Frontend: React page

1. If `nemesis-frontend/` doesn't exist yet, scaffold it first (Vite +
   React + TypeScript + Tailwind + shadcn/ui + React Router + TanStack
   Query) - see design-system.md for the exact initial setup and global
   shell (sidebar + top bar + content area) that every subsequent screen
   plugs into. Only scaffold this once; every later screen just adds a
   route + page.
2. Add a typed API client function per endpoint (`src/api/<module>.ts`)
   using `fetch`/`axios` + the DTO shape mirrored as a TypeScript
   `interface` (keep field names identical to the Java DTO's JSON
   property names to avoid mapping bugs).
3. Build the page inside the existing shell, following the mandatory
   3-column structure (left nav is already global/shared - the page
   itself implements the middle list/table + right detail/action panel):
   - **Middle column**: search bar + data table (TanStack Table or a
     shadcn `Table` wrapper), one row per record, sortable where the old
     `listbox` was sortable.
   - **Right column**: detail/action panel for the selected row - forms,
     status badges, and the action buttons that used to be inline
     `listcell` buttons in ZK (Onayla/Reddet/Iptal/etc.), now grouped
     here instead of one button-cluster per row. Empty/placeholder state
     when nothing is selected.
   - Follow every rule in design-system.md for spacing, color tokens,
     dark mode, typography and Gestalt grouping - do not invent new ad
     hoc colors or spacing values.
   - Check `references/data-visualization.md`'s decision checklist: if
     this screen's data has a meaningful status distribution, aggregate
     KPIs, a ranking, or a real time series, add a compact KPI strip
     and/or small chart above the table in the middle column. Skip this
     entirely for screens where it would just add noise (small tables,
     purely transactional single-record screens) - a chart is optional
     per screen, not a mandatory step.
4. Wire mutations through TanStack Query `useMutation`, invalidate the
   list query on success, and show a toast (use shadcn `sonner`/`toast`)
   mirroring the old `Clients.showNotification`/`Messagebox` message
   text. Show inline field errors or an error toast for
   400/409 responses, using the exact message from the API.
5. Add the route in the router config and a matching left-nav entry
   (reuse the existing menu grouping/naming from `nav/MenuRegistry.java`
   so the new left nav matches the old one's information architecture).
6. Make sure the page is responsive per design-system.md's breakpoint
   rules (columns collapse/stack on narrow viewports - do not just
   shrink everything proportionally).

### Phase 3 - Verification

1. Backend: `mvn -q compile`, restart server
   (`Get-Process java | Stop-Process -Force` then
   `nohup mvn -q spring-boot:run > /tmp/orion-runN.log 2>&1 &`), confirm
   `Started OrionApplication` with no ERROR lines, then `curl` the new
   endpoints directly to confirm the JSON shape and error responses.
2. Frontend: `npm run build` (or `npm run dev` for a quick manual check),
   fix any TypeScript errors.
3. Take a headless screenshot of the new React page (same Edge
   `--headless=new` technique used for ZK screens) and visually confirm:
   the 3-column layout renders, dark theme colors match the palette,
   table data loads, action buttons are visible for the right
   row-states. Clean up screenshot files after.
4. Confirm the *old* `.zul` screen still loads and still works - restart
   picks up backend changes for both ZK and REST simultaneously since
   they're the same Spring Boot app, so a broken migration could
   accidentally break the old screen too if a shared service method was
   touched. Re-check the old screen's screenshot if any shared service
   code was changed.
5. Report back to the user: what was migrated, what new API endpoints
   exist, any business rule or validation message you preserved
   verbatim, and remind them functional testing is theirs to do (per
   established workflow in this project).

## When the user gives ambiguous instructions

- If a screen's action doesn't map cleanly to a single REST verb (e.g. a
  bulk "apply to all selected" ZK command), ask how the React version
  should let users select the target rows (checkboxes column in the
  middle table is the natural translation, but confirm scope: single
  select vs multi-select) rather than guessing.
- If the screen involves money/balance/asset mutations and the old logic
  had any ambiguity you already resolved with the user in a prior ZK
  migration, reuse that same resolution silently - don't re-ask.
- If unsure whether a screen is "in scope" for this migration pass (e.g.
  it's still a `placeholder.zul` stub with no real logic), tell the user
  it has no real backend logic yet and ask whether they want a stub
  React page too or to skip it until the ZK side is implemented first.
