---
name: excel-export-button
description: Use when adding an "export to Excel" / "download as spreadsheet" button or feature to a screen, report, or list view in ANY codebase or project (not tied to a specific tech stack). Triggers on requests like "add an export to Excel button", "add a download as spreadsheet feature", "excel export ekle", "rapor oluştur butonu ekle", "generate an xlsx download", "add a button that exports this table". Covers the general, stack-agnostic pattern - one shared export function reused by every UI entry point, exporting the full filtered/unpaged result set, in-memory workbook generation, dated filenames, and consistent button/loading/toast UX - with concrete backend recipes (Java/Apache POI, Node.js/ExcelJS, Python/openpyxl, .NET/ClosedXML) and a frontend blob-download recipe in the references/ folder.
---

# Excel Export Button

A general, stack-agnostic playbook for adding an "export current results to
Excel" feature to a screen, in any project or language. Do not assume any
specific framework - Step 0 below has you look at what *this* project
actually uses before writing anything.

## Step 0: Identify the stack

Before writing code, check:

1. **Backend language/framework** - look at the dependency manifest
   (`pom.xml`, `build.gradle`, `package.json`, `requirements.txt`/
   `pyproject.toml`, `*.csproj`, `go.mod`, etc.) and how existing
   endpoints/routes/handlers are structured in this codebase.
2. **Frontend** - a JS framework (React/Vue/Svelte/Angular), a
   server-rendered template stack (Rails/Django templates, JSP, etc.), a
   stateful desktop-style UI framework (ZK, WinForms, JavaFX), or no
   frontend at all (a pure API/CLI export).
3. **Does an existing "list/search" endpoint or method already exist**
   for the data you want to export? The export MUST reuse its exact
   filter/search parameters - never build a second, slightly-different
   query from scratch.

## Core principles (apply regardless of stack)

1. **Single shared export function.** Exactly one function/method builds
   the file. Every UI entry point (a web button, a second legacy UI if the
   project has two frontends, a CLI command, a scheduled job) calls that
   *same* function. Never duplicate spreadsheet-building logic between
   entry points - if you find yourself writing the header/row loop twice,
   stop and extract/reuse instead.
2. **Export the full matching result set, unpaged.** Reuse the exact same
   filter/search parameters as the on-screen list, but skip pagination
   (`LIMIT`/`OFFSET`, `Pageable`, etc.) entirely - the user expects
   "everything I'm currently filtering for," not just the visible page.
   If the paginated list method can't cleanly be reused unpaged, add a
   sibling method with identical filters/sort and no pagination - don't
   modify the existing paginated one just to make this easier.
3. **Build the file in memory** (byte array / buffer / stream) and return
   raw bytes from the export function - don't write a temp file to disk
   unless the platform genuinely requires it (rare). This is what lets
   every caller reuse the function trivially without cleanup logic.
4. **Filename convention:** `<resource-name>-<yyyyMMdd>.xlsx` (date
   stamped). This avoids "file already exists, do you want to overwrite"
   browser confusion when the same report is exported twice in one day.
   Match whatever casing convention (kebab-case, snake_case) the rest of
   the project already uses for generated filenames.
5. **Correct content type.** `.xlsx` ->
   `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
   Legacy `.xls` -> `application/vnd.ms-excel`. If the project actually
   wants a plain `.csv` instead of a real spreadsheet, use `text/csv` and
   a much simpler line-writer instead of a spreadsheet library entirely -
   ask if it's genuinely unclear which format is wanted.
6. **Match existing UI conventions, don't invent new ones:**
   - Find how other "generate/positive action" buttons are styled
     (color, icon, placement) in this project and match them exactly.
   - Use the project's existing UI language for the label (don't default
     to English or any other language - check what other buttons say).
   - If the frontend can express async state, add a loading/disabled
     state while the request is in flight, with a label swap (e.g.
     "Exporting..."). If the project has no precedent anywhere for this
     kind of loading state (simple/legacy UIs), a synchronous
     fire-and-forget button without a spinner is fine and more
     consistent - don't add UI polish the rest of the app doesn't have.
   - Show a success/error notification (toast, alert, flash message -
     whatever the project already uses) after the export
     completes/fails.
7. **Don't invent a shared "ExcelExportUtil" abstraction** unless the
   project already has one, or this is clearly the second-or-later export
   feature in the codebase. A single inline implementation is easier to
   review, and there's nothing real to generalize from just one example.

## Step 1: Backend - the export function

See `references/backend-recipes.md` for the concrete library and code
pattern matching this project's backend language:
- Java (Spring or plain) -> Apache POI
- Node.js/TypeScript -> ExcelJS
- Python -> openpyxl
- .NET -> ClosedXML

Add the function next to the existing list/search method, in whatever
module/service/repository layer already owns that data, taking the exact
same filter parameters that method already takes.

## Step 2: Expose it

- **REST/HTTP API**: add a sibling endpoint next to the existing list
  endpoint, e.g. `GET /api/<resource>` (list) + `GET
  /api/<resource>/export` (identical query params, no pagination params).
  Return the raw bytes with the correct content type and a
  `Content-Disposition: attachment; filename="..."` header.
- **Server-rendered / stateful desktop-style UI frameworks** (ZK,
  WinForms, JSF, classic server MVC): trigger the download through
  whatever the framework's own download API is (e.g. ZK's
  `Filedownload.save(AMedia)`). If the project has BOTH a modern API and
  a legacy UI surface for the same data, make sure both call the exact
  same backend function from Step 1 - this is the single most important
  rule in this whole skill.
- If the project has more than one UI surface for the same data, verify
  every single one calls the same shared function - don't let a second
  surface reimplement the query or the workbook-building logic.

## Step 3: Frontend button

See `references/frontend-download.md` for the concrete pattern (blob
download via `fetch`/`axios` for SPA frontends, or a plain `<a href>`
link for simple server-rendered apps where a full navigation/download is
acceptable). Match the existing button styling/placement conventions
found in Step 0/principle 6 above.

## Testing

- Assert the button click produces the success notification/toast (or
  whatever completion signal the project uses) - this is testable across
  almost any framework and is the most valuable automated check.
- Assert the HTTP response (if there is one) has the correct content
  type and a non-empty body.
- Don't try to assert exact spreadsheet cell contents unless the project
  already has an `.xlsx`-parsing library available in its test
  dependencies - parsing the file just for a UI-level test is usually
  more effort than it's worth.
- Test with at least one active filter applied, not just the unfiltered
  default view - the export must honor whatever the user currently has
  filtered/searched for, not always "everything."

## Note on project-specific reference implementations

This skill deliberately does not hardcode any specific project's file
paths, package names, or UI text, so it stays usable across different
codebases. If you're working in a codebase that already has its own
validated example of this exact pattern (e.g. a project-level skill, or
an existing export feature elsewhere in the same repo), prefer copying
that project's own established convention (file locations, naming,
exact button text) over the generic placeholders in
`references/backend-recipes.md` - consistency with the rest of that
specific codebase always wins over this skill's generic defaults.
