const { saveHtmlReport } = require("./html-report");
const { savePdfReport } = require("./pdf-report");
const { suggestFix } = require("./diagnostics");

/**
 * Step-by-step reporter shared by every scenario script. Keeps console
 * output format consistent so the agent can summarize results back to
 * the user the same way regardless of which scenario ran, and can
 * optionally accumulate screenshots (as Buffers) and SQL query/result
 * pairs per step so a rich HTML/PDF report can be generated afterwards.
 *
 * Backwards compatible: pass(step, detail), fail(step, detail) and
 * info(step, detail) work exactly as before if the optional 4th
 * "extra" argument is omitted.
 */
class ScenarioReport {
  constructor(name) {
    this.name = name;
    this.steps = [];
    this.startedAt = Date.now();
  }

  _record(status, step, detail, extra) {
    const entry = { step, status, detail: detail ?? null, timestamp: Date.now() };
    if (extra?.screenshot) entry.screenshot = extra.screenshot; // Buffer (PNG)
    if (extra?.sql) entry.sql = extra.sql; // { query, rows }
    if (extra?.diagnostics) entry.diagnostics = extra.diagnostics; // { consoleErrors, pageErrors, networkErrors }
    if (extra?.suggestion) entry.suggestion = extra.suggestion; // string
    this.steps.push(entry);

    const tag = `[${status}]`;
    const suffix = detail ? ` - ${detail}` : "";
    console.log(`${tag} ${step}${suffix}`);
    if (extra?.screenshot) console.log(`       (screenshot yakalandi, ${extra.screenshot.length} bytes)`);
    if (extra?.sql) {
      console.log(`       SQL: ${extra.sql.query}`);
      console.log(`       Sonuc: ${extra.sql.rows.length} satir`);
    }
    if (extra?.suggestion) console.log(`       ONERI: ${extra.suggestion}`);
  }

  /** @param {{screenshot?: Buffer}} [extra] */
  pass(step, detail, extra) {
    this._record("PASS", step, detail, extra);
  }

  /**
   * Marks a step as failed. A fix suggestion is generated automatically
   * from the error text (and, if `extra.diagnostics` is provided - see
   * helpers/diagnostics.js#attachPageDiagnostics().getLogs() - also from
   * captured console/network errors) unless extra.suggestion is
   * explicitly given. Both are recorded so the HTML report can show a
   * dedicated "Neden basarisiz oldu?" block with an actionable next
   * step and, when available, supporting console/network evidence.
   * @param {{screenshot?: Buffer, diagnostics?: object, suggestion?: string}} [extra]
   */
  fail(step, detail, extra) {
    const enriched = { ...extra };
    if (!enriched.suggestion) {
      enriched.suggestion = suggestFix({ errorMessage: detail ?? "", diagnostics: enriched.diagnostics ?? {} });
    }
    this._record("FAIL", step, detail, enriched);
  }

  /** @param {{screenshot?: Buffer}} [extra] */
  info(step, detail, extra) {
    this._record("INFO", step, detail, extra);
  }

  /**
   * Records a SQL query + its result rows as its own report step, so
   * it renders as a distinct "SQL" block (query + result table) in the
   * HTML/PDF report instead of being buried inside a detail string.
   */
  sql(step, query, rows) {
    this._record("SQL", step, null, { sql: { query, rows: rows ?? [] } });
  }

  /**
   * Records an unexpected exception (e.g. from the script's top-level
   * catch block) as a FAIL step, including its stack trace and any
   * captured page diagnostics, with an auto-generated suggestion.
   * Call this from `run().catch(err => ...)` before writing the HTML
   * report so crashes are just as diagnosable as regular fail() calls,
   * instead of only appearing as a bare console.error.
   */
  crash(step, err, diagnostics) {
    const detail = err?.stack || err?.message || String(err);
    this.fail(step, detail, diagnostics ? { diagnostics } : undefined);
  }

  summary() {
    const failed = this.steps.filter((s) => s.status === "FAIL").length;
    const durationMs = Date.now() - this.startedAt;
    console.log("");
    console.log(`=== ${this.name}: ${failed === 0 ? "BASARILI" : "BASARISIZ"} (${durationMs}ms, ${this.steps.length} adim, ${failed} hata) ===`);
    return { name: this.name, ok: failed === 0, durationMs, startedAt: this.startedAt, steps: this.steps };
  }

  /**
   * Renders every recorded step (including screenshots and SQL blocks)
   * into a standalone, Orion dark-theme HTML file and returns the
   * absolute path written. Call after summary(). Safe to call even if
   * no screenshots/sql were recorded - those sections simply don't
   * render for that step.
   */
  async writeHtmlReport(outputPath) {
    const result = this.steps === undefined ? null : { name: this.name, ok: this.steps.every((s) => s.status !== "FAIL"), durationMs: Date.now() - this.startedAt, startedAt: this.startedAt, steps: this.steps };
    return saveHtmlReport(result, outputPath);
  }

  /**
   * Renders the same report straight to PDF (via a headless-browser
   * print of the generated HTML - no extra native dependency). Writes
   * an intermediate HTML file next to the PDF (same basename) unless
   * keepHtml is set false, in which case the temp HTML is removed
   * after conversion.
   */
  async writePdfReport(outputPath, { keepHtml = true } = {}) {
    const result = { name: this.name, ok: this.steps.every((s) => s.status !== "FAIL"), durationMs: Date.now() - this.startedAt, startedAt: this.startedAt, steps: this.steps };
    return savePdfReport(result, outputPath, { keepHtml });
  }
}

module.exports = { ScenarioReport };
