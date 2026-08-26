/**
 * Senaryo: Hisse Risk Parametreleri (React: /risk/hisse-risk-parametreleri)
 * sayfasindaki "Toplu Net Varlik Limit Carpani Guncelleme" dialogunda bir
 * Excel dosyasi yuklenir, onizleme tablosu dogrulanir, "Onaya Gonder" ile
 * DB'ye yazilir ve degisiklik veritabaninda dogrulanir.
 *
 * ZK karsiligi: screens/zk/net-varlik-limit-carpani-toplu-guncelleme.cjs
 * (ayni HESAP_NO/YENI_DEGER, ayni onizleme/DB dogrulama mantigi).
 *
 * Bu ekran YENI KAYIT olusturmuyor, MEVCUT (seed) hisse_risk_parametreleri
 * satirlarini gunceller - bu yuzden teardown'da silme degil, ORIJINAL
 * degerlere geri yazma yapilir.
 *
 * Kullanim: node screens/react/net-varlik-limit-carpani-toplu-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): FRONTEND_URL (varsayilan http://localhost:5173)
 */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, waitForToast } = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SCENARIO_NAME = "Hisse Risk Parametreleri (React) - Toplu Net Varlik Limit Carpani Guncelleme";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `net-varlik-limit-carpani-toplu-guncelleme-${Date.now()}.html`);
const TMP_XLSX_PATH = path.join(__dirname, "..", "..", "tmp", `toplu-guncelleme-react-${Date.now()}.xlsx`);

// Seed veri: account_id=1 (hesap_no=10001) hem Musteri hem Yatirim
// Danismani satirina sahip (bkz. V46__seed_hisse_risk_parametreleri.sql).
const HESAP_NO = "10001";
const YENI_DEGER = 4;

function xlsxOlustur(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Hesap No", "Net Varlik Limit Carpani"],
    [HESAP_NO, YENI_DEGER],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filePath);
}

/** [role="dialog"] icindeki onizleme tablosunun tek-hucreli placeholder olmayan satirlarini okur. */
async function getDialogPreviewRows(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll("tbody tr"))
      .map((row) => Array.from(row.querySelectorAll("td")).map((td) => td.textContent.trim()))
      .filter((cells) => cells.length > 1);
  });
}

async function run() {
  const report = new ScenarioReport(SCENARIO_NAME);
  let browser;
  let orijinalSatirlar = [];

  try {
    // --- Adim 0: guncellenecek satirlarin ORIJINAL degerlerini kaydet (teardown icin) ---
    orijinalSatirlar = await runQuery(
      `SELECT p.hisse_risk_parametre_id, p.net_varlik_limit_carpani ` +
        `FROM hisse_risk_parametreleri p JOIN accounts a ON a.account_id = p.account_id ` +
        `WHERE a.hesap_no = '${HESAP_NO}' ORDER BY p.hisse_risk_parametre_id;`
    );
    report.sql("Orijinal degerler kaydedildi (teardown icin)",
      `SELECT ... WHERE a.hesap_no = '${HESAP_NO}'`, orijinalSatirlar);
    if (orijinalSatirlar.length < 2) {
      report.fail("Seed veri beklenmedik", `hesap_no=${HESAP_NO} icin 2 satir bekleniyordu, ${orijinalSatirlar.length} bulundu`);
    }

    xlsxOlustur(TMP_XLSX_PATH);
    report.pass("Test Excel dosyasi olusturuldu", `${TMP_XLSX_PATH} (Hesap No=${HESAP_NO}, Yeni Deger=${YENI_DEGER})`);

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: sayfayi ac, toplu guncelleme dialogunu ac ---
    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Hisse Risk Parametreleri sayfasi acildi", `${BASE_URL}/risk/hisse-risk-parametreleri`);

    await clickButtonByText(page, "Toplu Net Varlik Limit Carpani Guncelleme");
    await new Promise((r) => setTimeout(r, 400));
    const dialogScreenshot = await page.screenshot();
    report.pass("Toplu Guncelleme dialogu acildi", null, { screenshot: dialogScreenshot });

    // --- Adim 2: Excel yukle (gercek input hidden, dogrudan uploadFile ile) ---
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      report.fail("Dosya input'u bulunamadi", "input[type=file] DOM'da yok", { diagnostics: diagnostics.getLogs() });
    } else {
      await fileInput.uploadFile(TMP_XLSX_PATH);
      await new Promise((r) => setTimeout(r, 1200));
      report.pass("Excel dosyasi yuklendi", TMP_XLSX_PATH);
    }

    // --- Adim 3: onizleme tablosunu dogrula (tek satir: Hesap No / Eski / Yeni / Durum) ---
    const previewScreenshot = await page.screenshot();
    const onizlemeRows = await getDialogPreviewRows(page);
    const onizlemeRow = onizlemeRows.find((cells) => cells.join(" | ").includes(HESAP_NO) && cells.join(" | ").includes("Guncellenecek"));
    if (onizlemeRow) {
      report.pass(
        "Onizleme tablosunda beklenen tek satir bulundu (Hesap No basina 1 satir)",
        onizlemeRow.join(" | "),
        { screenshot: previewScreenshot }
      );
    } else {
      report.fail(
        "Onizleme tablosunda beklenen satir bulunamadi",
        `Gorunen satirlar: ${JSON.stringify(onizlemeRows)}`,
        { screenshot: previewScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 4: Onaya Gonder ---
    await clickButtonByText(page, "Onaya Gonder");
    const confirmToast = await waitForToast(page);
    const afterApplyScreenshot = await page.screenshot();
    if (confirmToast && confirmToast.includes("risk profili guncellendi")) {
      report.pass("Basari toast'i goruldu", confirmToast, { screenshot: afterApplyScreenshot });
      if (confirmToast.includes(String(orijinalSatirlar.length))) {
        report.pass("Guncellenen satir sayisi toast'la uyumlu", confirmToast);
      }
    } else {
      report.fail("Basari toast'i goruntenmedi", confirmToast ?? "(toast bulunamadi)", {
        screenshot: afterApplyScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 5: veritabaninda dogrula ---
    const dbQuery = `SELECT p.hisse_risk_parametre_id, p.kullanici_tipi, p.net_varlik_limit_carpani ` +
      `FROM hisse_risk_parametreleri p JOIN accounts a ON a.account_id = p.account_id ` +
      `WHERE a.hesap_no = '${HESAP_NO}' ORDER BY p.hisse_risk_parametre_id;`;
    const dbRows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, dbRows);
    const hepsiGuncellendi = dbRows.length > 0 && dbRows.every((r) => Number(r.net_varlik_limit_carpani) === YENI_DEGER);
    if (hepsiGuncellendi) {
      report.pass("Veritabaninda her iki satir da guncellendi", `net_varlik_limit_carpani=${YENI_DEGER} (${dbRows.length} satir)`);
    } else {
      report.fail("Veritabaninda beklenen guncelleme bulunamadi", JSON.stringify(dbRows));
    }
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(TMP_XLSX_PATH)) fs.unlinkSync(TMP_XLSX_PATH);
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  // --- Teardown: orijinal degerlere geri don (bu satirlar seed veri, silinmez) ---
  if (orijinalSatirlar.length > 0) {
    console.log("\nTemizlik: orijinal net_varlik_limit_carpani degerleri geri yazliyor...");
    for (const row of orijinalSatirlar) {
      await runQuery(
        `UPDATE hisse_risk_parametreleri SET net_varlik_limit_carpani = ${row.net_varlik_limit_carpani} ` +
          `WHERE hisse_risk_parametre_id = ${row.hisse_risk_parametre_id};`
      );
    }
    console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport(`${SCENARIO_NAME} (CRASH)`);
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `net-varlik-limit-carpani-toplu-guncelleme-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
