const puppeteer = require("puppeteer-core");

// Locate a usable Chromium-family browser without downloading one.
// Edge is preinstalled on the Windows dev machine this project runs on.
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

/**
 * Launches a headless Edge instance sized for the Orion dark-theme UI.
 * Always call browser.close() in a finally block - callers are
 * responsible for cleanup so screenshots/traces aren't orphaned.
 */
async function launchBrowser(options = {}) {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--window-size=1600,1000", "--disable-dev-shm-usage"],
    ...options,
  });
  return browser;
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  return page;
}

module.exports = { launchBrowser, newPage, EDGE_PATH };
