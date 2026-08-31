/**
 * Reusable interaction primitives for the legacy ZK7 UI.
 *
 * IMPORTANT - discovered empirically (see references/zk-dom-notes.md):
 * ZK regenerates every widget id on each page load/reload (e.g. "iF9Pc"
 * on one load, "hGAPc" on the next) - ids are NEVER stable across runs
 * and must not be hardcoded in any script. Every helper here selects by
 * DOM order, CSS class, or visible text instead.
 */

/** Finds a button (native <button> or ZK's .z-button) by its exact visible text. */
async function clickButtonByText(page, text) {
  const buttons = await page.$$("button, .z-button");
  for (const b of buttons) {
    const t = await page.evaluate((el) => el.textContent.trim(), b);
    if (t === text) {
      await page.evaluate(el => el.click(), b);
      return true;
    }
  }
  throw new Error(`clickButtonByText: no button found with text "${text}"`);
}

/**
 * Fills plain ZK textboxes/decimalboxes in the DOM order they appear on
 * the page (matches the grid row order in the .zul file top-to-bottom).
 * `values` is an ordered array; pass `null` to skip a field.
 */
async function fillTextboxesInOrder(page, values, selector = "input.z-textbox, input.z-decimalbox") {
  const inputs = await page.$$(selector);
  if (inputs.length < values.length) {
    throw new Error(
      `fillTextboxesInOrder: expected at least ${values.length} inputs matching "${selector}", found ${inputs.length}`
    );
  }
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null || values[i] === undefined) continue;
    await inputs[i].click({ clickCount: 3 }); // select existing content first
    await inputs[i].type(String(values[i]));
  }
}

/**
 * Sets the Nth ZK `<intbox>` (input.z-intbox) on the page to a given
 * numeric value (0-indexed DOM order) - selects existing content first
 * so it replaces rather than appends.
 */
async function setIntboxByIndex(page, index, value) {
  const inputs = await page.$$("input.z-intbox");
  if (index >= inputs.length) {
    throw new Error(`setIntboxByIndex: only ${inputs.length} intboxes found, index ${index} out of range`);
  }
  await inputs[index].click({ clickCount: 3 });
  await inputs[index].type(String(value));
  await inputs[index].press("Tab");
}

/** Returns the current value of every ZK `<intbox>` on the page, in DOM order. */
async function getIntboxValues(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("input.z-intbox")).map((el) => el.value));
}

/**
 * Selects an option in the Nth ZK combobox on the page (0-indexed, DOM
 * order) by opening it and choosing the item whose text matches
 * exactly. If the combobox already defaults to the desired value this
 * is a no-op after opening/closing, so prefer calling only when the
 * value actually needs to change.
 *
 * IMPORTANT (discovered on Bildirim Izleme, see dom-notes.md): clicking
 * `input.z-combobox-input` only focuses the text field for typing - it
 * does NOT open the dropdown popup. The popup is opened by its sibling
 * `.z-combobox-button` (the caret icon) instead.
 *
 * IMPORTANT (discovered on Bildirim Ayarlari): a `<combobox model="@load(...)">`
 * with a `<template name="model"><comboitem label="@load(each.xxx)"/></template>`
 * renders multi-word labels with `\u00A0` (non-breaking space) in place of
 * EVERY regular space in the DOM text content, even though the bound Java
 * string itself only has plain ASCII spaces (confirmed via direct DB byte
 * check) - a client-side ZK rendering quirk, not a data bug. Both sides of
 * the text comparison are normalized below so callers can keep passing
 * plain-space strings.
 */
async function selectComboboxByIndex(page, index, optionText) {
  const combos = await page.$$("input.z-combobox-input");
  if (index >= combos.length) {
    throw new Error(`selectComboboxByIndex: only ${combos.length} comboboxes found, index ${index} out of range`);
  }
  const button = await combos[index].evaluateHandle((input) => input.closest(".z-combobox")?.querySelector(".z-combobox-button"));
  const buttonEl = button.asElement();
  if (!buttonEl) {
    throw new Error(`selectComboboxByIndex: could not find .z-combobox-button for combobox #${index}`);
  }
  await buttonEl.click();
  await new Promise((r) => setTimeout(r, 250));
  // The popup uses position:fixed, so offsetParent is always null for
  // its items regardless of real visibility (a DOM spec quirk) - use
  // bounding-rect dimensions to filter to the currently-open popup.
  const normalize = (s) => s.replace(/\u00A0/g, " ");
  const target = normalize(optionText);
  const items = await page.$$(".z-comboitem");
  for (const item of items) {
    const visible = await page.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }, item);
    if (!visible) continue;
    const t = normalize(await page.evaluate((el) => el.textContent.trim(), item));
    if (t === target) {
      await item.click();
      return true;
    }
  }
  throw new Error(`selectComboboxByIndex: option "${optionText}" not found in combobox #${index}`);
}

/**
 * Returns every ZK listbox/grid data row as an array of trimmed <td>
 * cell text, e.g. ["10001", "Ahmet Yilmaz", "SERBEST", ...]. Use this
 * to assert a new/updated record appears in a list without relying on
 * any id.
 *
 * ZK renders data rows with different classes depending on the
 * container: plain <grid>/<listbox> use ".z-row", but a <listbox>
 * nested inside a <tabbox>/<tabpanel> (e.g. Teminat Onay Ekrani) uses
 * ".z-listitem" instead. Both are queried and merged so callers don't
 * need to know which container type a given screen uses. The
 * ".z-listhead" header row is excluded automatically since it has no
 * <td> cells with visible text matching a data row's shape.
 */
async function getGridRows(page) {
  return page.evaluate(() => {
    const rowEls = document.querySelectorAll(".z-row, .z-listitem");
    return Array.from(rowEls)
      .map((row) =>
        Array.from(row.querySelectorAll("td"))
          .map((td) => td.textContent.trim())
          .filter((t) => t.length > 0)
      )
      .filter((cells) => cells.length > 0);
  });
}

/**
 * Finds the first grid row whose cells contain every string in
 * `expectedFragments` (substring match, order-independent). Returns
 * the row's cell array or null. Prefer matching on stable business
 * keys (hesapNo + miktar + durum) rather than free-text fields, since
 * not every column is rendered in every tab (e.g. "aciklama" is absent
 * from the Teminat Onay "Transfer Talepleri" grid).
 */
async function findGridRow(page, expectedFragments) {
  const rows = await getGridRows(page);
  return (
    rows.find((cells) => {
      const joined = cells.join(" | ");
      return expectedFragments.every((frag) => joined.includes(frag));
    }) ?? null
  );
}

/**
 * Same as getGridRows/findGridRow, but scoped to only the currently
 * VISIBLE rows.
 *
 * IMPORTANT (discovered on Bildirim Izleme, see dom-notes.md): a
 * <tabbox> with a separate <listbox> in each <tabpanel> renders ALL
 * tabpanels' listboxes in the DOM at once (only toggling `display`),
 * unlike React's conditional-render tabs. Plain getGridRows() would
 * double/triple-count rows from the currently-hidden tab(s). Use these
 * variants whenever a screen has more than one listbox across tabs.
 */
async function getVisibleGridRows(page) {
  return page.evaluate(() => {
    const rowEls = Array.from(document.querySelectorAll(".z-row, .z-listitem")).filter(
      (r) => r.offsetParent !== null
    );
    return rowEls
      .map((row) =>
        Array.from(row.querySelectorAll("td"))
          .map((td) => td.textContent.trim())
          .filter((t) => t.length > 0)
      )
      .filter((cells) => cells.length > 0);
  });
}

async function findVisibleGridRow(page, expectedFragments) {
  const rows = await getVisibleGridRows(page);
  return (
    rows.find((cells) => {
      const joined = cells.join(" | ");
      return expectedFragments.every((frag) => joined.includes(frag));
    }) ?? null
  );
}

/**
 * Sets the Nth native <input type="checkbox"> on the page (0-indexed DOM
 * order) to the desired checked state - idempotent (only clicks if the
 * current state differs). ZK's <checkbox> widget renders a real
 * <input type="checkbox"> under a wrapping <span class="... z-checkbox">
 * (any `sclass` is appended to that span's class list, e.g. a
 * "toggle-switch" custom CSS skin) - the input itself is a normal
 * checkbox, clickable directly with no ZK-specific quirks.
 */
async function setCheckboxByIndex(page, index, checked) {
  const checkboxes = await page.$$('input[type="checkbox"]');
  if (index >= checkboxes.length) {
    throw new Error(`setCheckboxByIndex: only ${checkboxes.length} checkboxes found, index ${index} out of range`);
  }
  const current = await page.evaluate((el) => el.checked, checkboxes[index]);
  if (current !== checked) {
    await checkboxes[index].click();
  }
}

/**
 * Returns the displayed text of every ZK combobox on the page, in DOM
 * order. IMPORTANT: `document.body.innerText`/`textContent` do NOT
 * include an `<input>` element's `value` (it's an attribute/property,
 * not a text node) - a combobox's currently-selected display text is
 * invisible to any innerText-based assertion. Read `input.value`
 * directly instead, as this helper does.
 */
async function getComboboxValues(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("input.z-combobox-input")).map((el) => el.value));
}

/**
 * Returns { value, disabled } for every ZK combobox on the page, in DOM
 * order. ZK renders `disabled="true"` as the real `disabled` attribute
 * on the underlying `input.z-combobox-input`, so this is a plain DOM
 * read - no ZK-specific quirk beyond the usual "select by DOM order,
 * never by id" rule.
 */
async function getComboboxStates(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("input.z-combobox-input")).map((el) => ({
      value: el.value,
      disabled: el.disabled,
    }))
  );
}

/** Returns { checked, disabled } for every native <input type="checkbox"> on the page, in DOM order. */
async function getCheckboxStates(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('input[type="checkbox"]')).map((el) => ({
      checked: el.checked,
      disabled: el.disabled,
    }))
  );
}

/** Waits for and returns the text of a ZK Messagebox (confirm/alert dialog), or null if none appears within timeoutMs. */
async function waitForMessagebox(page, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = await page.evaluate(() => {
      const box = document.querySelector(".z-messagebox-window, .z-window-highlighted");
      return box ? box.textContent.trim() : null;
    });
    if (text) return text;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

/** Clicks a Messagebox button ("OK"/"Yes"/"No"/etc.) by its visible text. */
async function clickMessageboxButton(page, text) {
  return clickButtonByText(page, text);
}

module.exports = {
  clickButtonByText,
  fillTextboxesInOrder,
  selectComboboxByIndex,
  getGridRows,
  findGridRow,
  getVisibleGridRows,
  findVisibleGridRow,
  waitForMessagebox,
  clickMessageboxButton,
  setCheckboxByIndex,
  getCheckboxStates,
  getComboboxValues,
  getComboboxStates,
  setIntboxByIndex,
  getIntboxValues,
};
