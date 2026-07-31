/**
 * Senaryo: Teminat Islemleri (ZK: collateral/teminat-transfer.zul)
 * ekraninda yeni bir teminat transfer talebi olusturulur; ardindan
 * (1) veritabaninda collateral_transfers tablosunda BEKLEMEDE
 * durumunda yeni kaydin olustugu, (2) Teminat Onay Ekrani
 * (collateral/teminat-onay.zul) "Transfer Talepleri" sekmesinde ayni
 * kaydin gorundugu dogrulanir.
 *
 * Kullanim: node screens/zk/teminat-transfer-olusturma.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, fillTextboxesInOrder, findGridRow } = require("../../helpers/zk");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `teminat-transfer-olusturma-${Date.now()}.html`);

// Test verisi - benzersiz olmasi icin aciklamaya timestamp eklenir,
// boylece ayni senaryo art arda calistirildiginda eski kayitlarla
// karismaz.
const HESAP_NO = "10001";
const MIKTAR = "1500";
const ACIKLAMA = `Otomasyon test transferi ${Date.now()}`;

async function run() {
  const report = new ScenarioReport("Teminat Islemleri - Yeni Transfer Talebi Olusturma");
  let browser;
  let createdTransferId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Teminat Transfer ekranini ac, formu doldur, gonder ---
    await page.goto(`${BASE_URL}/collateral/teminat-transfer.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Teminat Transfer ekrani acildi", `${BASE_URL}/collateral/teminat-transfer.zul`);

    // DOM sirasi: [0] Hesap No, [1] Piyasa, [2] Saklamaci, [3] Miktar
    // (decimalbox), [4] Aciklama. Comboboxlar (Teminat Tipi/Kaynak
    // Depo/Hedef Depo/Para Birimi) varsayilan degerleriyle birakilir
    // (NAKIT_DOVIZ/SERBEST/TEMINAT/TRY) - senaryo bunlari degistirmeyi
    // gerektirmiyor.
    await fillTextboxesInOrder(page, [HESAP_NO, "BIST", "MKK", MIKTAR, ACIKLAMA]);
    const formScreenshot = await page.screenshot();
    report.pass("Form dolduruldu", `Hesap: ${HESAP_NO}, Miktar: ${MIKTAR}`, { screenshot: formScreenshot });

    await clickButtonByText(page, "Transfer Talebi Olustur");
    await new Promise((r) => setTimeout(r, 1200));

    const bodyText = await page.evaluate(() => document.body.innerText);
    const successScreenshot = await page.screenshot();
    if (bodyText.includes("olusturuldu")) {
      report.pass("Basari mesaji goruldu", bodyText.match(/Transfer talebi olusturuldu[^\n]*/)?.[0], { screenshot: successScreenshot });
    } else {
      report.fail("Basari mesaji goruntenmedi", "Sayfada 'olusturuldu' metni bulunamadi", { screenshot: successScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Veritabaninda dogrula ---
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
      report.fail("Veritabaninda kayit bulunamadi veya durum BEKLEMEDE degil", JSON.stringify(rows));
    }

    // --- Adim 3: Teminat Onay Ekrani'nda dogrula ---
    await page.goto(`${BASE_URL}/collateral/teminat-onay.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // Not: "Transfer Talepleri" grid'i aciklama kolonunu GOSTERMEZ (bkz.
    // teminat-onay.zul), bu yuzden hesapNo + miktar + durum uclusu ile
    // eslesme araniyor - bu satirlar arasinda benzersizligi garanti
    // etmez ama demo/manuel dogrulama amaci icin yeterlidir.
    const matchedRow = await findGridRow(page, [HESAP_NO, "1500.0000", "BEKLEMEDE"]);
    const onayScreenshot = await page.screenshot();
    if (matchedRow) {
      report.pass("Teminat Onay Ekrani'nda talep goruldu", matchedRow.join(" | "), { screenshot: onayScreenshot });
    } else {
      report.fail("Teminat Onay Ekrani'nda talep bulunamadi", `Aranan: hesapNo=${HESAP_NO}, miktar=1500.0000, durum=BEKLEMEDE`, { screenshot: onayScreenshot, diagnostics: diagnostics.getLogs() });
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
    const crashReport = new ScenarioReport("Teminat Islemleri - Yeni Transfer Talebi Olusturma (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `teminat-transfer-olusturma-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
