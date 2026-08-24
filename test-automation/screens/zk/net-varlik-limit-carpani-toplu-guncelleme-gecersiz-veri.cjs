/**
 * Senaryo: Hisse Risk Parametreleri > "Net Varlik Limit Carpani Toplu
 * Guncelleme" ic tabinda GECERSIZ bir Excel yuklendiginde (Net Varlik
 * Limit Carpani 1-5 araligi disinda), onizleme tablosunun bunu kirmizi/
 * "Gecersiz Deger" olarak isaretledigi VE "Onaya Gonder" butonunun
 * disabled olup DB'ye hicbir yazma yapilmadigi dogrulanir.
 *
 * Bu, kullanicinin bildirdigi bir bug'in duzeltmesini test eder: onceden
 * gecersiz satirlar varken bile "Onaya Gonder" tiklanabiliyor, basari
 * mesaji gosteriyor ama hicbir satiri gercekten guncellemiyordu (sessiz
 * basarisizlik). Duzeltme: buton artik gecersiz satir varken disabled.
 *
 * Kullanim: node screens/zk/net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, findVisibleGridRow, getVisibleGridRows } = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri-${Date.now()}.html`);
const TMP_XLSX_PATH = path.join(__dirname, "..", "..", "tmp", `toplu-guncelleme-gecersiz-${Date.now()}.xlsx`);

// account_id=1 (hesap_no=10001) hem Musteri hem Yatirim Danismani satirina
// sahip (bkz. V46__seed_hisse_risk_parametreleri.sql). 1-5 disi bir deger
// (9) her iki satiri da "Gecersiz Deger" yapmali.
const HESAP_NO = "10001";
const GECERSIZ_DEGER = 9;

function xlsxOlustur(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Hesap No", "Net Varlik Limit Carpani"],
    [HESAP_NO, GECERSIZ_DEGER],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filePath);
}

async function run() {
  const report = new ScenarioReport("Hisse Risk Parametreleri - Toplu Guncelleme Gecersiz Veri Engelleme");
  let browser;
  let orijinalSatirlar = [];

  try {
    orijinalSatirlar = await runQuery(
      `SELECT p.hisse_risk_parametre_id, p.net_varlik_limit_carpani ` +
        `FROM hisse_risk_parametreleri p JOIN accounts a ON a.account_id = p.account_id ` +
        `WHERE a.hesap_no = '${HESAP_NO}' ORDER BY p.hisse_risk_parametre_id;`
    );
    report.sql("Test oncesi mevcut degerler kaydedildi", `SELECT ... WHERE a.hesap_no = '${HESAP_NO}'`, orijinalSatirlar);

    xlsxOlustur(TMP_XLSX_PATH);
    report.pass("Gecersiz test Excel dosyasi olusturuldu", `${TMP_XLSX_PATH} (Hesap No=${HESAP_NO}, Deger=${GECERSIZ_DEGER}, 1-5 disi)`);

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Hisse Risk Parametreleri ekrani acildi", `${BASE_URL}/risk/hisse-risk-parametreleri.zul`);

    await clickButtonByText(page, "Net Varlik Limit Carpani Toplu Guncelleme");
    await new Promise((r) => setTimeout(r, 500));

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      report.fail("Dosya input'u bulunamadi", "input[type=file] DOM'da yok", { diagnostics: diagnostics.getLogs() });
    } else {
      await fileInput.uploadFile(TMP_XLSX_PATH);
      await new Promise((r) => setTimeout(r, 1500));
      report.pass("Gecersiz Excel dosyasi yuklendi", TMP_XLSX_PATH);
    }

    // --- Onizleme tablosunda "Gecersiz Deger" beklenir ---
    const previewScreenshot = await page.screenshot();
    const gecersizRow = await findVisibleGridRow(page, [HESAP_NO, "Gecersiz Deger"]);
    if (gecersizRow) {
      report.pass("Onizleme tablosu satiri gecersiz olarak isaretledi", gecersizRow.join(" | "), { screenshot: previewScreenshot });
    } else {
      const allRows = await getVisibleGridRows(page);
      report.fail("Onizleme tablosunda 'Gecersiz Deger' satiri bulunamadi", JSON.stringify(allRows), { screenshot: previewScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Uyari etiketi gorunur olmali ---
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes("Onaya Gonder icin oncelikle")) {
      report.pass("Uyari etiketi goruntulendi", "'Onaya Gonder icin oncelikle...' metni sayfada bulundu");
    } else {
      report.fail("Uyari etiketi goruntulenmedi", "Beklenen uyari metni sayfada yok", { diagnostics: diagnostics.getLogs() });
    }

    // --- "Onaya Gonder" butonu disabled olmali ---
    const onayaGonderDisabled = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, .z-button"));
      const btn = buttons.find((b) => b.textContent.trim() === "Onaya Gonder");
      if (!btn) return null;
      const realButton = btn.tagName === "BUTTON" ? btn : btn.querySelector("button");
      return realButton ? realButton.disabled : btn.classList.contains("z-button-disd");
    });
    if (onayaGonderDisabled === true) {
      report.pass("Onaya Gonder butonu disabled", "buton devre disi, tiklanamaz durumda");
    } else {
      report.fail("Onaya Gonder butonu disabled DEGIL", `disabled degeri: ${onayaGonderDisabled}`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Yine de tiklamayi dene (gercek kullanici hatasi senaryosu) - hicbir etkisi olmamali ---
    await clickButtonByText(page, "Onaya Gonder").catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const afterClickText = await page.evaluate(() => document.body.innerText);
    const messageboxAppeared = await page.evaluate(() => !!document.querySelector(".z-messagebox-window, .z-window-highlighted"));
    if (!messageboxAppeared && afterClickText.includes("risk profili guncellendi") === false) {
      report.pass("Disabled butona tiklama hicbir islem tetiklemedi", "basari mesaji gorunmedi, sekme kapanmadi");
    } else {
      report.fail("Disabled buton yine de bir islemi tetikledi", messageboxAppeared ? "Messagebox goruntulendi" : afterClickText.slice(0, 200));
    }

    // --- Veritabaninda HICBIR degisiklik olmamali ---
    const dbQuery = `SELECT p.hisse_risk_parametre_id, p.net_varlik_limit_carpani ` +
      `FROM hisse_risk_parametreleri p JOIN accounts a ON a.account_id = p.account_id ` +
      `WHERE a.hesap_no = '${HESAP_NO}' ORDER BY p.hisse_risk_parametre_id;`;
    const dbRows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, dbRows);
    const degismedi = orijinalSatirlar.every((orig) => {
      const guncel = dbRows.find((r) => r.hisse_risk_parametre_id === orig.hisse_risk_parametre_id);
      return guncel && Number(guncel.net_varlik_limit_carpani) === Number(orig.net_varlik_limit_carpani);
    });
    if (degismedi) {
      report.pass("Veritabaninda hicbir deger degismedi", `orijinal degerler korundu: ${JSON.stringify(orijinalSatirlar)}`);
    } else {
      report.fail("Veritabaninda beklenmedik bir degisiklik oldu", `orijinal: ${JSON.stringify(orijinalSatirlar)}, guncel: ${JSON.stringify(dbRows)}`);
    }
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(TMP_XLSX_PATH)) fs.unlinkSync(TMP_XLSX_PATH);
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);
  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Hisse Risk Parametreleri - Toplu Guncelleme Gecersiz Veri Engelleme (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
