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
      await b.click();
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
 * Selects an option in the Nth ZK combobox on the page (0-indexed, DOM
 * order) by clicking it open and choosing the item whose text matches
 * exactly. If the combobox already defaults to the desired value this
 * is a no-op after opening/closing, so prefer calling only when the
 * value actually needs to change.
 */
async function selectComboboxByIndex(page, index, optionText) {
  const combos = await page.$$("input.z-combobox-input");
  if (index >= combos.length) {
    throw new Error(`selectComboboxByIndex: only ${combos.length} comboboxes found, index ${index} out of range`);
  }
  await combos[index].click();
  await new Promise((r) => setTimeout(r, 250));
  const items = await page.$$(".z-comboitem");
  for (const item of items) {
    const t = await page.evaluate((el) => el.textContent.trim(), item);
    if (t === optionText) {
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
  waitForMessagebox,
  clickMessageboxButton,
};
