# Frontend: triggering the file download

## SPA frontends (React, Vue, Svelte, Angular, or plain JS with an API backend)

The universal browser-side pattern - request the file as a `blob`, then
synthesize a click on a hidden `<a download>` element. This works
identically regardless of which JS framework wraps it.

```ts
async function exportToExcel(filters: FiltersType): Promise<void> {
  const response = await fetch(`/api/<resource>/export?${new URLSearchParams(filters)}`);
  // or with axios: const response = await apiClient.get("/api/<resource>/export", { params: filters, responseType: "blob" })
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  link.href = url;
  link.download = `<resource-name>-${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
```

Component-level wiring (React shown, same shape in any framework with
component-local state):

```tsx
const [exporting, setExporting] = useState(false);

async function handleExportClick() {
  setExporting(true);
  try {
    await exportToExcel(currentFilters);
    showSuccessToast("Export complete."); // use whatever toast/notification system this project already has
  } catch (error) {
    showErrorToast("Export failed.");
  } finally {
    setExporting(false);
  }
}
```

```tsx
<button onClick={handleExportClick} disabled={exporting}>
  {exporting ? "Exporting..." : "Export to Excel"}
</button>
```

Notes:
- The backend's `Content-Disposition` filename header is effectively
  decorative once you set `link.download` explicitly - the browser uses
  the `download` attribute, not the header, to name the saved file. You
  can skip reading the header entirely and just compute the filename
  client-side with the same date-stamped convention as the backend; they
  don't need to be plumbed together, just kept conventionally consistent.
- No external download library is needed for this - avoid adding one
  (e.g. `file-saver`) unless the project already depends on it.

## Server-rendered / simple full-page-navigation apps

If the app doesn't have a JS framework managing state (classic
server-rendered HTML, or a simple admin panel), skip the blob/JS
approach entirely - a plain link is enough, and the browser's native
download handling takes care of everything:

```html
<a href="/api/<resource>/export?status=active&from=2024-01-01" class="btn btn-success">
  Export to Excel
</a>
```

The server's `Content-Disposition: attachment` header alone is
sufficient to make the browser download instead of navigate. No loading
state is achievable this way (the browser doesn't expose a "download
started" JS event for a plain link click) - that's an acceptable
limitation, don't try to fake one with JS unless the rest of this
specific app already has a precedent for that kind of polish.

## Stateful desktop-style UI frameworks (ZK, WinForms, JavaFX, etc.)

These frameworks have their own native "trigger a file save dialog / push
bytes to the browser" API - use that directly instead of any of the
above (e.g. ZK's `org.zkoss.zul.Filedownload.save(AMedia)`,
WinForms' `SaveFileDialog` + `File.WriteAllBytes`). The export button's
click handler should call the exact same shared backend export function
from `backend-recipes.md` - the only difference from the web-API path is
how the bytes reach the user, not where they come from.
