const fs = require("node:fs");
const path = require("node:path");
const { launchBrowser } = require("./browser");
const { saveHtmlReport } = require("./html-report");

/**
 * Converts a ScenarioReport result into a PDF by rendering the same
 * HTML report and printing it with headless Edge (page.pdf()). No
 * extra native dependency needed - the project already has no
 * LaTeX/pandoc/wkhtmltopdf installed, so this reuses the Puppeteer
 * install that already drives the test scenarios.
 *
 * Writes an intermediate .html file next to the PDF (same basename)
 * so the report can also be viewed/edited directly in a browser;
 * pass keepHtml: false to delete it after the PDF is produced.
 */
async function savePdfReport(result, outputPath, { keepHtml = true } = {}) {
  const absPdfPath = path.resolve(outputPath);
  const htmlPath = absPdfPath.replace(/\.pdf$/i, ".html");

  saveHtmlReport(result, htmlPath);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
    await page.pdf({
      path: absPdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
    });
  } finally {
    if (browser) await browser.close();
  }

  if (!keepHtml) fs.rmSync(htmlPath, { force: true });

  return absPdfPath;
}

module.exports = { savePdfReport };
