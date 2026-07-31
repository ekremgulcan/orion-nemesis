/**
 * Senaryo: Teminat Islemleri (React: /collateral/islemleri) sayfasinda
 * "Yeni Transfer Talebi" dialogundan yeni bir teminat transfer talebi
 * olusturulur; ardindan (1) veritabaninda collateral_transfers
 * tablosunda BEKLEMEDE durumunda yeni kaydin olustugu, (2) basari
 * toast'inin goruntulendigi dogrulanir.
 *
 * Kullanim: node screens/react/teminat-islemleri-yeni-transfer.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, fillInputsInOrder, waitForToast } = require("../../helpers/react");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `teminat-islemleri-yeni-transfer-${Date.now()}.html`);
const HESAP_NO = "10001";
const MIKTAR = "1500";
const ACIKLAMA = `React otomasyon test ${Date.now()}`;

async function run() {
  const report = new ScenarioReport("Teminat Islemleri (React) - Yeni Transfer Talebi Olusturma");
  let browser;
  let createdTransferId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/collateral/islemleri`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Teminat Islemleri sayfasi acildi", `${BASE_URL}/collateral/islemleri`);

    await clickButtonByText(page, "Yeni Transfer Talebi");
    await new Promise((r) => setTimeout(r, 400));
    const dialogScreenshot = await page.screenshot();
    report.pass("Yeni Transfer Talebi dialogu acildi", null, { screenshot: dialogScreenshot });

    // Dialog'a scope edilmis (root: '[role="dialog"]', varsayilan)
    // [data-slot="input"] DOM sirasi: Hesap No, Piyasa, Saklamaci,
    // Miktar, Aciklama. Piyasa/Saklamaci zaten "BIST"/"MKK"
    // varsayilanlariyla doluyor (bkz. EMPTY_FORM in
    // TeminatIslemleriPage.tsx), null gecilerek degistirilmeden
    // birakilir. Scope onemli: dialog acikken arka plandaki sayfanin
    // kendi arama Input'u da DOM'da kalir ve scope edilmezse index
    // kaymasina yol acar.
    await fillInputsInOrder(page, [HESAP_NO, null, null, MIKTAR, ACIKLAMA]);
    const formScreenshot = await page.screenshot();
    report.pass("Form dolduruldu", `Hesap: ${HESAP_NO}, Miktar: ${MIKTAR}`, { screenshot: formScreenshot });

    await clickButtonByText(page, "Transfer Talebi Olustur");
    const toastText = await waitForToast(page);
    const toastScreenshot = await page.screenshot();
    if (toastText && toastText.includes("olusturuldu")) {
      report.pass("Basari toast'i goruldu", toastText, { screenshot: toastScreenshot });
    } else {
      report.fail("Basari toast'i goruntenmedi", toastText ?? "(toast bulunamadi)", { screenshot: toastScreenshot, diagnostics: diagnostics.getLogs() });
    }

    const dbQuery = `SELECT TOP 1 transfer_id, account_id, miktar, durum, aciklama FROM collateral_transfers WHERE aciklama = '${ACIKLAMA}' ORDER BY transfer_id DESC;`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].durum === "BEKLEMEDE") {
      createdTransferId = rows[0].transfer_id;
      report.pass(
        "Veritabaninda yeni kayit bulundu",
        `transfer_id=${rows[0].transfer_id}, miktar=${rows[0].miktar}, durum=${rows[0].durum}`
      );
    } else {
      report.fail("Veritabaninda kayit bulunamadi veya durum BEKLEMEDE degil", JSON.stringify(rows), { diagnostics: diagnostics.getLogs() });
    }
  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  if (createdTransferId) {
    console.log(`\nTemizlik: transfer_id=${createdTransferId} test kaydi siliniyor...`);
    await deleteById("collateral_transfers", "transfer_id", createdTransferId);
    console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Teminat Islemleri (React) - Yeni Transfer Talebi Olusturma (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `teminat-islemleri-yeni-transfer-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
