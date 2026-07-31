/**
 * Senaryo: Nakit Islem Giris (React: /cash/islem-giris) sayfasinda
 * "Yeni Talep" dialogundan yeni bir nakit islem talebi olusturulur;
 * ardindan (1) veritabaninda cash_transaction_requests tablosunda
 * BEKLEMEDE durumunda yeni kaydin olustugu, (2) basari toast'inin
 * goruntulendigi, (3) ayni sayfadaki tabloda kaydin gorundugu
 * dogrulanir (bu ekranda ayri bir onay ekrani yok - onay/red
 * aksiyonlari da ayni sayfanin sag panelinde sunuluyor).
 *
 * Kullanim: node screens/react/nakit-islem-giris-yeni-talep.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, fillInputsInOrder, waitForToast, findTableRow } = require("../../helpers/react");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `nakit-islem-giris-yeni-talep-${Date.now()}.html`);

const HESAP_NO = "10001";
const EMIR_VEREN = `React Otomasyon Test ${Date.now()}`;
const TUTAR = "2500";
const ACIKLAMA = `React otomasyon test nakit talebi ${Date.now()}`;

async function run() {
  const report = new ScenarioReport("Nakit Islem Giris (React) - Yeni Islem Talebi Olusturma");
  let browser;
  let createdRequestId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/cash/islem-giris`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const openScreenshot = await page.screenshot();
    report.pass("Nakit Islem Giris sayfasi acildi", `${BASE_URL}/cash/islem-giris`, { screenshot: openScreenshot });

    await clickButtonByText(page, "Yeni Talep");
    await new Promise((r) => setTimeout(r, 400));
    const dialogScreenshot = await page.screenshot();
    report.pass("Yeni Islem Talebi dialogu acildi", null, { screenshot: dialogScreenshot });

    // Dialog'a scope edilmis [data-slot="input"] DOM sirasi: Hesap No,
    // Emir Veren, Valor Tarihi, Tutar, IBAN, IYM Banka Hesabi,
    // Aciklama. Talep Kanali/Para Birimi/Islem Yonu/Yontem birer
    // Select oldugu icin fillInputsInOrder tarafindan atlanir (yerinde
    // varsayilan degerleriyle birakilir: SUBE/TRY/ODEME/IBAN). Yontem
    // varsayilan olarak IBAN oldugu icin IBAN alani goruntuleniyor,
    // Karsi Hesap No alani gizli (bkz. NakitIslemGirisPage.tsx satir
    // 491-506) - bu yuzden degerler dizisinde ona karsilik gelen slot
    // yok.
    await fillInputsInOrder(page, [HESAP_NO, EMIR_VEREN, null, TUTAR, "TR330006100519786457841326", null, ACIKLAMA]);
    const formScreenshot = await page.screenshot();
    report.pass("Form dolduruldu", `Hesap: ${HESAP_NO}, Emir Veren: ${EMIR_VEREN}, Tutar: ${TUTAR}`, { screenshot: formScreenshot });

    await clickButtonByText(page, "Islem Talebi Olustur");
    const toastText = await waitForToast(page);
    const toastScreenshot = await page.screenshot();
    if (toastText && toastText.includes("olusturuldu")) {
      report.pass("Basari toast'i goruldu", toastText, { screenshot: toastScreenshot });
    } else {
      report.fail("Basari toast'i goruntenmedi", toastText ?? "(toast bulunamadi)", { screenshot: toastScreenshot, diagnostics: diagnostics.getLogs() });
    }

    const dbQuery = `SELECT TOP 1 request_id, account_id, tutar, durum, emir_veren, aciklama FROM cash_transaction_requests WHERE aciklama = '${ACIKLAMA}' ORDER BY request_id DESC;`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].durum === "BEKLEMEDE") {
      createdRequestId = rows[0].request_id;
      report.pass(
        "Veritabaninda yeni kayit bulundu",
        `request_id=${rows[0].request_id}, tutar=${rows[0].tutar}, durum=${rows[0].durum}`
      );
    } else {
      report.fail("Veritabaninda kayit bulunamadi veya durum BEKLEMEDE degil", JSON.stringify(rows), { diagnostics: diagnostics.getLogs() });
    }

    // --- Ayni sayfadaki tabloda dogrula (ayri onay ekrani yok) ---
    // Tutar kolonu tr-TR locale ile formatlaniyor (2500 -> "2.500,00"),
    // bu yuzden ham "2500" degil formatlanmis hali aranir.
    await new Promise((r) => setTimeout(r, 500));
    const formattedTutar = Number(TUTAR).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    const matchedRow = await findTableRow(page, [HESAP_NO, formattedTutar]);
    const tableScreenshot = await page.screenshot();
    if (matchedRow) {
      report.pass("Islem Gecmisi tablosunda talep goruldu", matchedRow.join(" | "), { screenshot: tableScreenshot });
    } else {
      report.fail("Islem Gecmisi tablosunda talep bulunamadi", `Aranan: hesapNo=${HESAP_NO}, tutar=${formattedTutar}`, { screenshot: tableScreenshot, diagnostics: diagnostics.getLogs() });
    }
  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  if (createdRequestId) {
    console.log(`\nTemizlik: request_id=${createdRequestId} test kaydi siliniyor...`);
    await deleteById("cash_transaction_requests", "request_id", createdRequestId);
    console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Nakit Islem Giris (React) - Yeni Islem Talebi Olusturma (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `nakit-islem-giris-yeni-talep-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
