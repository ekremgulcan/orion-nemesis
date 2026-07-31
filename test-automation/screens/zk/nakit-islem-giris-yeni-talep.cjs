/**
 * Senaryo: Nakit Islem Giris (ZK: cash/nakit-islem-giris.zul) ekraninda
 * yeni bir nakit islem talebi olusturulur; ardindan (1) veritabaninda
 * cash_transaction_requests tablosunda BEKLEMEDE durumunda yeni
 * kaydin olustugu, (2) ayni ekrandaki "Islem Gecmisi" listesinde
 * kaydin gorundugu dogrulanir (bu ekranda ayri bir onay ekrani yok -
 * onay/red aksiyonlari da ayni ekranda satir icinde sunuluyor).
 *
 * Kullanim: node screens/zk/nakit-islem-giris-yeni-talep.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, fillTextboxesInOrder, findGridRow } = require("../../helpers/zk");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `nakit-islem-giris-yeni-talep-${Date.now()}.html`);

// Test verisi - benzersiz olmasi icin aciklamaya timestamp eklenir.
const HESAP_NO = "10001";
const EMIR_VEREN = `Otomasyon Test ${Date.now()}`;
const TUTAR = "2500";
const ACIKLAMA = `Otomasyon test nakit talebi ${Date.now()}`;

async function run() {
  const report = new ScenarioReport("Nakit Islem Giris (ZK) - Yeni Islem Talebi Olusturma");
  let browser;
  let createdRequestId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Nakit Islem Giris ekranini ac ---
    await page.goto(`${BASE_URL}/cash/nakit-islem-giris.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const openScreenshot = await page.screenshot();
    report.pass("Nakit Islem Giris ekrani acildi", `${BASE_URL}/cash/nakit-islem-giris.zul`, { screenshot: openScreenshot });

    // DOM sirasi: [0] Hesap No, [1] Emir Veren, [2] Tutar (decimalbox),
    // [3] IBAN, [4] Karsi Hesap No, [5] IYM Banka Hesabi, [6] Aciklama.
    // Talep Kanali/Valor Tarihi/Para Birimi/Islem Yonu/Yontem
    // comboboxlari varsayilan degerleriyle birakilir
    // (SUBE/bugun/TRY/ODEME/IBAN) - senaryo bunlari degistirmeyi
    // gerektirmiyor, IBAN yontemi zorunlu IBAN alanini gerektirir.
    await fillTextboxesInOrder(page, [HESAP_NO, EMIR_VEREN, TUTAR, "TR330006100519786457841326", null, null, ACIKLAMA]);
    const formScreenshot = await page.screenshot();
    report.pass("Form dolduruldu", `Hesap: ${HESAP_NO}, Emir Veren: ${EMIR_VEREN}, Tutar: ${TUTAR}`, { screenshot: formScreenshot });

    await clickButtonByText(page, "Islem Talebi Olustur");
    await new Promise((r) => setTimeout(r, 1200));

    const bodyText = await page.evaluate(() => document.body.innerText);
    const successScreenshot = await page.screenshot();
    if (bodyText.includes("olusturuldu")) {
      report.pass("Basari mesaji goruldu", bodyText.match(/Islem talebi olusturuldu[^\n]*/)?.[0], { screenshot: successScreenshot });
    } else {
      report.fail("Basari mesaji goruntenmedi", "Sayfada 'olusturuldu' metni bulunamadi", { screenshot: successScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Veritabaninda dogrula ---
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

    // --- Adim 3: Ayni ekrandaki "Islem Gecmisi" listesinde dogrula ---
    // Bu ekranda ayri bir onay ekrani yok (teminat-transfer/teminat-onay
    // ciftinin aksine) - onay/red aksiyonlari da bu listede satir
    // icinde sunuluyor, bu yuzden capraz dogrulama sayfayi yenileyip
    // ayni listbox'ta kaydin gorunmesini kontrol etmek seklinde yapilir.
    // Listbox olusturma_tarihi'ne gore azalan sirali ve pageSize=15 ile
    // sayfali (bkz. CashTransactionRequestRepository#findAllFetched,
    // nakit-islem-giris.zul), bu yuzden yeni kayit her zaman ilk
    // sayfanin en ustunde yer alir - ayrica sayfa gezinmeye gerek yok.
    // Tutar burada "11237.00" gibi 2 ondalikli formatlanir (teminat
    // transferlerindeki 4 ondalikli "1500.0000" formatindan farkli).
    await page.reload({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const matchedRow = await findGridRow(page, [HESAP_NO, `${TUTAR}.00`, "BEKLEMEDE"]);
    const listScreenshot = await page.screenshot();
    if (matchedRow) {
      report.pass("Islem Gecmisi listesinde talep goruldu", matchedRow.join(" | "), { screenshot: listScreenshot });
    } else {
      report.fail("Islem Gecmisi listesinde talep bulunamadi", `Aranan: hesapNo=${HESAP_NO}, tutar=${TUTAR}.0000, durum=BEKLEMEDE`, { screenshot: listScreenshot, diagnostics: diagnostics.getLogs() });
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
    const crashReport = new ScenarioReport("Nakit Islem Giris (ZK) - Yeni Islem Talebi Olusturma (CRASH)");
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
