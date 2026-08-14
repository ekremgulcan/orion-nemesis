/**
 * Reusable interaction primitives for the new React UI
 * (nemesis-frontend). Like the ZK helpers, everything here selects by
 * visible text/role/data-attribute - never by generated id. shadcn/
 * base-ui components emit ids like "base-ui-_r_0_" that are just as
 * unstable across reloads as ZK's, and most plain <button>s render
 * with no id at all.
 */

/** Finds a button by its exact visible text (works for shadcn <Button>, which renders a plain <button>). */
async function clickButtonByText(page, text) {
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const t = await page.evaluate((el) => el.textContent.trim(), b);
    if (t === text) {
      await b.click();
      return true;
    }
  }
  throw new Error(`clickButtonByText: no button found with text "${text}"`);
}

/**
 * Fills shadcn <Input> fields ([data-slot="input"]) in DOM order
 * (matches the visual top-to-bottom / left-to-right order of Field
 * blocks in the page's JSX). Pass null to skip a field (e.g. when a
 * field already has the desired default value, or is a Select rather
 * than a plain Input).
 *
 * IMPORTANT: scope this to a Dialog/AlertDialog root when filling a
 * modal form - the underlying page's own search Input(s) stay mounted
 * in the DOM behind an open Dialog and would otherwise shift every
 * subsequent index by one. Pass a `root` selector (default
 * '[role="dialog"]') to scope the query; pass root: null to search the
 * whole page (e.g. for same-page forms like Rapor Yonetimi).
 */
async function fillInputsInOrder(page, values, { root = '[role="dialog"]' } = {}) {
  const scopeSelector = root ? `${root} ` : "";
  const inputs = await page.$$(`${scopeSelector}[data-slot="input"], ${scopeSelector}[data-slot="textarea"]`);
  if (inputs.length < values.length) {
    throw new Error(
      `fillInputsInOrder: expected at least ${values.length} inputs within "${root ?? "page"}", found ${inputs.length}`
    );
  }
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null || values[i] === undefined) continue;
    await inputs[i].click({ clickCount: 3 });
    await inputs[i].type(String(values[i]));
  }
}

/**
 * Opens the Nth shadcn/base-ui <Select> on the page (0-indexed, DOM
 * order of [data-slot="select-trigger"]) and picks the option whose
 * text matches exactly.
 *
 * IMPORTANT (discovered on Bildirim Ayarlari, multiple Acik/Kapali
 * selects on one page): base-ui's Select pre-renders EVERY select's
 * option list into the DOM at all times (only the currently-open
 * popup's items get real layout - closed ones report a zero/null
 * bounding box) - the same "all tabpanels rendered at once" quirk
 * already known from ZK `<tabbox>`, just in the base-ui world. A plain
 * text-match search across `[data-slot="select-item"]` can therefore
 * click a stale item belonging to a DIFFERENT, closed select if two
 * selects on the page share an option label (e.g. two "Acik"/"Kapali"
 * dropdowns) - it silently grabs the first DOM match, which fails with
 * "Node is either not clickable" since it has no real layout. Items
 * are filtered to only those with a non-zero bounding box (i.e.
 * belonging to the popup that's actually open) before matching text.
 */
async function selectDropdownByIndex(page, index, optionText) {
  const triggers = await page.$$('[data-slot="select-trigger"]');
  if (index >= triggers.length) {
    throw new Error(`selectDropdownByIndex: only ${triggers.length} selects found, index ${index} out of range`);
  }
  await triggers[index].click();
  await new Promise((r) => setTimeout(r, 250));
  const items = await page.$$('[data-slot="select-item"], [role="option"]');
  for (const item of items) {
    const box = await item.boundingBox();
    if (!box || box.width === 0 || box.height === 0) continue;
    const t = await page.evaluate((el) => el.textContent.trim(), item);
    if (t === optionText) {
      await item.click();
      return true;
    }
  }
  throw new Error(`selectDropdownByIndex: option "${optionText}" not found in select #${index}`);
}

/**
 * Returns { disabled } for every shadcn/base-ui `[data-slot="select-trigger"]`
 * on the page, in DOM order. base-ui's Select.Trigger renders as a real
 * `<button>` and reflects the `disabled` prop straight onto the DOM
 * `disabled` attribute/property, so this is a plain read (same
 * confidence level as `zk.js#getComboboxStates`).
 */
async function getSelectDisabledStates(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="select-trigger"]')).map((el) => ({
      disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled"),
    }))
  );
}

/** Clicks a row in a shadcn <Table> whose cell text contains every string in expectedFragments. */
async function clickTableRowContaining(page, expectedFragments) {
  const rows = await page.$$("tbody tr");
  for (const row of rows) {
    const text = await page.evaluate((el) => el.textContent, row);
    if (expectedFragments.every((f) => text.includes(f))) {
      await row.click();
      return true;
    }
  }
  return false;
}

/**
 * Returns every <tbody> row's cell text as an array of arrays, e.g.
 * [["10001", "Ahmet Yilmaz", ...], ...]. Skips single-<td> placeholder
 * rows (e.g. `<TableCell colSpan={N}>Kayit bulunamadi</TableCell>` /
 * "Yukleniyor...") - every real data table in this app has more than
 * one column, so a lone-cell row is always an empty/loading state, not
 * data. Without this, an empty result set would be miscounted as 1 row
 * instead of 0 (found via Bildirim Izleme's "Bugunku Bildirimler" tab
 * showing 0 DB rows but this helper reporting 1).
 */
async function getTableRows(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("tbody tr"))
      .map((row) => Array.from(row.querySelectorAll("td")).map((td) => td.textContent.trim()))
      .filter((cells) => cells.length > 1);
  });
}

/** Finds the first table row whose cells contain every string in expectedFragments (substring match). Returns the cell array or null. */
async function findTableRow(page, expectedFragments) {
  const rows = await getTableRows(page);
  return (
    rows.find((cells) => {
      const joined = cells.join(" | ");
      return expectedFragments.every((frag) => joined.includes(frag));
    }) ?? null
  );
}

/**
 * Toggles the Nth plain HTML checkbox ([type="checkbox"]) within
 * `root` (default '[role="dialog"]', matching fillInputsInOrder's
 * default scope) to the desired checked state. Used for pages that
 * render raw <input type="checkbox"> instead of a shadcn component
 * (e.g. the "Izinler" group in HesapHisseKontrolPage.tsx) - clicking
 * only when the current state differs from `checked` keeps this
 * idempotent regardless of the checkbox's current value.
 */
async function setCheckboxByIndex(page, index, checked, { root = '[role="dialog"]' } = {}) {
  const scopeSelector = root ? `${root} ` : "";
  const checkboxes = await page.$$(`${scopeSelector}input[type="checkbox"]`);
  if (index >= checkboxes.length) {
    throw new Error(`setCheckboxByIndex: only ${checkboxes.length} checkboxes found within "${root ?? "page"}", index ${index} out of range`);
  }
  const current = await page.evaluate((el) => el.checked, checkboxes[index]);
  if (current !== checked) {
    await checkboxes[index].click();
  }
}

/**
 * Returns the checked state of every plain HTML checkbox within
 * `root` (default '[role="dialog"]'), in DOM order - useful for
 * asserting a form's current permission state without needing to
 * click anything.
 */
async function getCheckboxStates(page, { root = '[role="dialog"]' } = {}) {
  const scopeSelector = root ? `${root} ` : "";
  return page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(`${sel}input[type="checkbox"]`)).map((el) => el.checked);
  }, scopeSelector);
}

/**
 * Fills the Nth `[data-slot="input"]` that is NOT a `type="date"`
 * field, in DOM order. Needed on screens whose toolbar has date
 * inputs (e.g. Baslangic/Bitis) ahead of per-column text filters that
 * use the same shadcn Input component/data-slot - see dom-notes.md.
 * Root defaults to the whole page (unlike `fillInputsInOrder`, whose
 * default `[role="dialog"]` scope doesn't apply to same-page toolbars).
 */
async function fillNthNonDateInput(page, index, value, { root = null } = {}) {
  const handle = await page.evaluateHandle(
    (sel, idx) => {
      const scope = sel ? document.querySelector(sel) : document;
      const inputs = Array.from(scope.querySelectorAll('[data-slot="input"]')).filter(
        (i) => i.getAttribute("type") !== "date"
      );
      return inputs[idx] || null;
    },
    root,
    index
  );
  const el = handle.asElement();
  if (!el) throw new Error(`fillNthNonDateInput: no non-date input found at index ${index}`);
  await el.click({ clickCount: 3 });
  await el.type(String(value));
}

/**
 * Sets the Nth native `<input type="date">` on the page (0-indexed DOM
 * order) by typing an "MMDDYYYY" string into it - native date inputs
 * accept per-segment keyboard entry and auto-advance
 * month->day->year, and ElementHandle.type() sends real key events so
 * React's onChange actually fires (unlike setting `.value` directly,
 * which React's controlled input would just overwrite back). Pass a
 * JS Date or "YYYY-MM-DD" string as `isoDate`.
 *
 * IMPORTANT: clicks near the input's LEFT edge (not its center/default
 * ElementHandle.click()) to land focus on the month segment. A plain
 * center click can land on the day/year segment instead (the shadcn
 * Input's calendar icon shifts where the visible "mm / dd / yyyy"
 * text actually sits within the box), and typing into the wrong
 * segment first silently produces a garbled value (e.g. typing
 * "08012026" landed in the year segment and produced "12026-08-04"
 * instead of "2026-08-01" - found the hard way, see dom-notes.md).
 */
async function fillDateInputByIndex(page, index, isoDate) {
  const inputs = await page.$$('input[type="date"]');
  if (index >= inputs.length) {
    throw new Error(`fillDateInputByIndex: only ${inputs.length} date inputs found, index ${index} out of range`);
  }
  const iso = isoDate instanceof Date ? isoDate.toISOString().slice(0, 10) : isoDate;
  const [y, m, d] = iso.split("-");
  const box = await inputs[index].boundingBox();
  if (!box) throw new Error(`fillDateInputByIndex: date input at index ${index} is not visible`);
  await page.mouse.click(box.x + 10, box.y + box.height / 2);
  await inputs[index].type(`${m}${d}${y}`);
}

/**
 * Sets the Nth base-ui/shadcn <Switch> (`[role="switch"]`, NOT a real
 * `<input type="checkbox">`) within `root` to the desired checked state -
 * idempotent (only clicks if current state differs). base-ui's Switch.Root
 * renders `<span role="switch" aria-checked="true|false" data-slot="switch">`
 * (see components/ui/switch.tsx) - state must be read via `aria-checked`,
 * `.checked` does not exist on a span. Root defaults to `null` (whole page)
 * since this component is used on same-page forms, not just dialogs.
 */
async function setSwitchByIndex(page, index, checked, { root = null } = {}) {
  const scopeSelector = root ? `${root} ` : "";
  const switches = await page.$$(`${scopeSelector}[role="switch"]`);
  if (index >= switches.length) {
    throw new Error(`setSwitchByIndex: only ${switches.length} switches found within "${root ?? "page"}", index ${index} out of range`);
  }
  const current = await page.evaluate((el) => el.getAttribute("aria-checked") === "true", switches[index]);
  if (current !== checked) {
    await switches[index].click();
  }
}

/** Returns { checked, disabled } for every `[role="switch"]` within `root`, in DOM order. */
async function getSwitchStates(page, { root = null } = {}) {
  const scopeSelector = root ? `${root} ` : "";
  return page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(`${sel}[role="switch"]`)).map((el) => ({
        checked: el.getAttribute("aria-checked") === "true",
        disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true" || el.getAttribute("data-disabled") !== null,
      })),
    scopeSelector
  );
}

/**
 * Waits for a sonner toast (success/error) to appear and returns its
 * text, or null if none appears within timeoutMs. Sonner renders each
 * toast with a stable [data-sonner-toast] attribute regardless of
 * content, so this does not depend on any id.
 */
async function waitForToast(page, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = await page.evaluate(() => {
      const el = document.querySelector("[data-sonner-toast]");
      return el ? el.textContent.trim() : null;
    });
    if (text) return text;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

module.exports = {
  clickButtonByText,
  fillInputsInOrder,
  selectDropdownByIndex,
  getSelectDisabledStates,
  clickTableRowContaining,
  getTableRows,
  findTableRow,
  waitForToast,
  setCheckboxByIndex,
  getCheckboxStates,
  setSwitchByIndex,
  getSwitchStates,
  fillDateInputByIndex,
  fillNthNonDateInput,
};
