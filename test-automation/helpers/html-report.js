const fs = require("node:fs");
const path = require("node:path");

/**
 * Renders a ScenarioReport result (see helpers/report.js summary()
 * shape) into a single, self-contained HTML file styled with the
 * Orion Nemesis dark theme palette (colors lifted directly from
 * nemesis-frontend/src/index.css so the report feels native to the
 * product instead of a generic test-runner dump).
 *
 * Screenshots are embedded as base64 data URIs so the resulting HTML
 * is a single portable file - no companion .png files to manage or
 * gitignore.
 */

const THEME = {
  background: "#0b1220",
  foreground: "#e7ecf5",
  foregroundMuted: "#9aa7bd",
  surface: "#111a2e",
  surfaceElevated: "#16233d",
  primary: "#d9a441",
  success: "#3ba55d",
  successMuted: "#16291c",
  danger: "#d94f4f",
  dangerMuted: "#2e1717",
  warning: "#d9a441",
  warningMuted: "#3a3016",
  info: "#4a90d9",
  infoMuted: "#16233a",
  border: "#26324a",
};

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString("tr-TR");
}

function statusBadge(status) {
  const map = {
    PASS: { bg: THEME.successMuted, fg: THEME.success, label: "BASARILI" },
    FAIL: { bg: THEME.dangerMuted, fg: THEME.danger, label: "BASARISIZ" },
    INFO: { bg: THEME.infoMuted, fg: THEME.info, label: "BILGI" },
    SQL: { bg: THEME.warningMuted, fg: THEME.warning, label: "SQL" },
  };
  const s = map[status] ?? map.INFO;
  return `<span class="badge" style="background:${s.bg};color:${s.fg};border:1px solid ${s.fg}33;">${s.label}</span>`;
}

function renderSqlBlock(sql) {
  if (!sql) return "";
  const rows = sql.rows ?? [];
  let tableHtml;
  if (rows.length === 0) {
    tableHtml = `<div class="sql-empty">Sonuc: 0 satir</div>`;
  } else {
    const headers = Object.keys(rows[0]);
    tableHtml = `
      <table class="sql-table">
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>`;
  }
  return `
    <div class="sql-block">
      <div class="sql-query">${escapeHtml(sql.query)}</div>
      ${tableHtml}
    </div>`;
}

function renderScreenshot(screenshot) {
  if (!screenshot) return "";
  const base64 = Buffer.isBuffer(screenshot) ? screenshot.toString("base64") : screenshot;
  return `<img class="screenshot" src="data:image/png;base64,${base64}" alt="ekran goruntusu" />`;
}

function renderDiagnosticsList(title, items) {
  if (!items || items.length === 0) return "";
  return `
    <div class="diag-group">
      <div class="diag-group-title">${escapeHtml(title)} (${items.length})</div>
      <ul class="diag-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>`;
}

/**
 * Renders the "Neden basarisiz oldu?" box for a FAIL step: the
 * auto-generated suggestion up top, followed by the raw captured
 * console/page/network diagnostics as supporting evidence. Either
 * piece is optional and simply omitted if not present on the step.
 */
function renderFailureAnalysis(step) {
  if (step.status !== "FAIL") return "";
  const { suggestion, diagnostics } = step;
  if (!suggestion && !diagnostics) return "";

  const diagBody = diagnostics
    ? [
        renderDiagnosticsList("Tarayici konsol hatalari", diagnostics.consoleErrors),
        renderDiagnosticsList("Sayfa (JS) hatalari", diagnostics.pageErrors),
        renderDiagnosticsList("Ag/HTTP hatalari", diagnostics.networkErrors),
      ].join("")
    : "";
  const hasDiagBody = diagnostics && (
    (diagnostics.consoleErrors ?? []).length > 0 ||
    (diagnostics.pageErrors ?? []).length > 0 ||
    (diagnostics.networkErrors ?? []).length > 0
  );

  return `
    <div class="failure-analysis">
      <div class="failure-analysis-title">Neden basarisiz oldu? &middot; Potansiyel cozum</div>
      ${suggestion ? `<div class="failure-suggestion">${escapeHtml(suggestion)}</div>` : ""}
      ${hasDiagBody ? `<div class="diag-groups">${diagBody}</div>` : ""}
    </div>`;
}

function renderStep(step, index) {
  return `
    <div class="step step-${step.status.toLowerCase()}">
      <div class="step-header">
        <span class="step-index">${index + 1}</span>
        <span class="step-title">${escapeHtml(step.step)}</span>
        ${statusBadge(step.status)}
      </div>
      ${step.detail ? `<div class="step-detail">${escapeHtml(step.detail)}</div>` : ""}
      ${renderSqlBlock(step.sql)}
      ${renderScreenshot(step.screenshot)}
      ${renderFailureAnalysis(step)}
    </div>`;
}

/**
 * Top-of-report "at a glance" box listing every failed step's name and
 * (if present) its auto-generated suggestion, so the agent/user can
 * see "where it broke and why" without scrolling through every step.
 * Renders nothing when the scenario passed.
 */
function renderHeaderFailureSummary(result) {
  const failedSteps = result.steps.filter((s) => s.status === "FAIL");
  if (failedSteps.length === 0) return "";
  return `
    <div class="header-failure-summary">
      <div class="header-failure-summary-title">Nerede patladi?</div>
      ${failedSteps
        .map(
          (s) => `
        <div class="header-failure-summary-item">
          <b>Adim ${result.steps.indexOf(s) + 1}:</b> ${escapeHtml(s.step)}
          ${s.suggestion ? ` &mdash; ${escapeHtml(s.suggestion)}` : ""}
        </div>`
        )
        .join("")}
    </div>`;
}

function renderReportHtml(result) {
  const passCount = result.steps.filter((s) => s.status === "PASS").length;
  const failCount = result.steps.filter((s) => s.status === "FAIL").length;
  const infoCount = result.steps.filter((s) => s.status === "INFO").length;
  const sqlCount = result.steps.filter((s) => s.status === "SQL").length;
  const overall = result.ok ? "BASARILI" : "BASARISIZ";
  const overallColor = result.ok ? THEME.success : THEME.danger;
  const overallBg = result.ok ? THEME.successMuted : THEME.dangerMuted;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(result.name)} - Test Raporu</title>
<style>
  @font-face {
    font-family: 'Geist Fallback';
    src: local('Segoe UI');
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px;
    background: ${THEME.background};
    background-image: radial-gradient(circle at 15% 0%, ${THEME.surfaceElevated} 0%, ${THEME.background} 55%);
    color: ${THEME.foreground};
    font-family: 'Segoe UI', 'Geist Fallback', sans-serif;
    line-height: 1.5;
  }
  .container { max-width: 900px; margin: 0 auto; }
  .header {
    background: ${THEME.surface};
    border: 1px solid ${THEME.border};
    border-radius: 12px;
    padding: 28px 32px;
    margin-bottom: 28px;
  }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 600; color: ${THEME.foreground}; }
  .header .subtitle { color: ${THEME.foregroundMuted}; font-size: 13px; }
  .overall-pill {
    display: inline-block;
    padding: 8px 18px;
    border-radius: 999px;
    background: ${overallBg};
    color: ${overallColor};
    border: 1px solid ${overallColor}55;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .stats { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
  .stat {
    background: ${THEME.surfaceElevated};
    border: 1px solid ${THEME.border};
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 13px;
    color: ${THEME.foregroundMuted};
  }
  .stat b { color: ${THEME.foreground}; font-size: 15px; display: block; }
  .steps { display: flex; flex-direction: column; gap: 14px; }
  .step {
    background: ${THEME.surface};
    border: 1px solid ${THEME.border};
    border-left: 3px solid ${THEME.border};
    border-radius: 10px;
    padding: 16px 20px;
  }
  .step-pass { border-left-color: ${THEME.success}; }
  .step-fail { border-left-color: ${THEME.danger}; }
  .step-info { border-left-color: ${THEME.info}; }
  .step-sql { border-left-color: ${THEME.warning}; }
  .step-header { display: flex; align-items: center; gap: 10px; }
  .step-index {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: 6px;
    background: ${THEME.surfaceElevated}; color: ${THEME.foregroundMuted};
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }
  .step-title { font-weight: 600; font-size: 14.5px; flex: 1; }
  .badge {
    font-size: 11px; font-weight: 700; letter-spacing: 0.4px;
    padding: 3px 10px; border-radius: 999px; flex-shrink: 0;
  }
  .step-detail {
    margin-top: 8px; margin-left: 34px;
    color: ${THEME.foregroundMuted}; font-size: 13px;
  }
  .sql-block { margin-top: 12px; margin-left: 34px; }
  .sql-query {
    font-family: 'Consolas', 'JetBrains Mono', monospace;
    font-size: 12.5px;
    background: ${THEME.surfaceElevated};
    color: ${THEME.warning};
    border: 1px solid ${THEME.border};
    border-radius: 8px;
    padding: 10px 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .sql-table {
    width: 100%; border-collapse: collapse; margin-top: 8px;
    font-family: 'Consolas', 'JetBrains Mono', monospace; font-size: 12px;
  }
  .sql-table th, .sql-table td {
    border: 1px solid ${THEME.border}; padding: 6px 10px; text-align: left;
  }
  .sql-table th { background: ${THEME.surfaceElevated}; color: ${THEME.foregroundMuted}; }
  .sql-table td { color: ${THEME.foreground}; }
  .sql-empty { margin-top: 8px; color: ${THEME.foregroundMuted}; font-size: 12.5px; font-style: italic; }
  .screenshot {
    display: block; margin-top: 12px; margin-left: 34px;
    max-width: calc(100% - 34px); border-radius: 8px; border: 1px solid ${THEME.border};
  }
  .failure-analysis {
    margin-top: 14px; margin-left: 34px;
    background: ${THEME.dangerMuted};
    border: 1px solid ${THEME.danger}55;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .failure-analysis-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
    color: ${THEME.danger}; margin-bottom: 8px;
  }
  .failure-suggestion {
    font-size: 13px; color: ${THEME.foreground}; line-height: 1.6;
  }
  .diag-groups { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
  .diag-group-title {
    font-size: 11px; font-weight: 600; color: ${THEME.foregroundMuted};
    text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px;
  }
  .diag-list {
    margin: 0; padding-left: 18px; font-family: 'Consolas', 'JetBrains Mono', monospace;
    font-size: 11.5px; color: ${THEME.foreground}; display: flex; flex-direction: column; gap: 3px;
  }
  .footer {
    margin-top: 32px; text-align: center; color: ${THEME.foregroundMuted};
    font-size: 12px; padding-bottom: 20px;
  }
  .footer .brand { color: ${THEME.primary}; font-weight: 600; }
  .header-failure-summary {
    margin-top: 18px;
    background: ${THEME.dangerMuted};
    border: 1px solid ${THEME.danger}55;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .header-failure-summary-title {
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
    color: ${THEME.danger}; margin-bottom: 6px;
  }
  .header-failure-summary-item { font-size: 13px; color: ${THEME.foreground}; margin-bottom: 4px; }
  .header-failure-summary-item b { color: ${THEME.danger}; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <div>
          <h1>${escapeHtml(result.name)}</h1>
          <div class="subtitle">${formatTimestamp(result.startedAt)} &middot; sure: ${formatDuration(result.durationMs)}</div>
        </div>
        <span class="overall-pill">${overall}</span>
      </div>
      <div class="stats">
        <div class="stat"><b>${result.steps.length}</b>Toplam Adim</div>
        <div class="stat"><b style="color:${THEME.success}">${passCount}</b>Basarili</div>
        <div class="stat"><b style="color:${THEME.danger}">${failCount}</b>Basarisiz</div>
        <div class="stat"><b style="color:${THEME.info}">${infoCount}</b>Bilgi</div>
        <div class="stat"><b style="color:${THEME.warning}">${sqlCount}</b>SQL Sorgusu</div>
      </div>
      ${renderHeaderFailureSummary(result)}
    </div>
    <div class="steps">
      ${result.steps.map((step, i) => renderStep(step, i)).join("")}
    </div>
    <div class="footer">Orion v3 Nemesis &middot; <span class="brand">test-automation</span> skill tarafindan uretildi</div>
  </div>
</body>
</html>`;
}

/**
 * Renders the result to HTML and writes it to outputPath, creating
 * parent directories as needed. Returns the absolute path written.
 */
function saveHtmlReport(result, outputPath) {
  const html = renderReportHtml(result);
  const absPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, html, "utf8");
  return absPath;
}

module.exports = { renderReportHtml, saveHtmlReport, THEME };
