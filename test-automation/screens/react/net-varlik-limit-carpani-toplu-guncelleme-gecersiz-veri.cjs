/**
 * Senaryo: Hisse Risk Parametreleri (React) > "Toplu Net Varlik Limit
 * Carpani Guncelleme" dialogunda GECERSIZ bir Excel yuklendiginde (Net
 * Varlik Limit Carpani 1-5 araligi disinda), onizleme tablosunun bunu
 * kirmizi/"Gecersiz Deger" olarak isaretledigi, bir uyari metninin
 * goruntulendigi VE "Onaya Gonder" butonunun disabled olup DB'ye hicbir
 * yazma yapilmadigi dogrulanir.
 *
 * ZK karsiligi: screens/zk/net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri.cjs
 * (ayni HESAP_NO/GECERSIZ_DEGER, ayni dogrulama mantigi - client-side
 * `onizlemeTumuGecerli` gate + server-side re-check).
 *
 * Kullanim: node screens/react/net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri.cjs
 * Ortam degiskenleri (opsiyonel): FRONTEND_URL (varsayilan http://localhost:5173)
 */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText } = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SCENARIO_NAME = "Hisse Risk Parametreleri (React) - Toplu Guncelleme Gecersiz Veri Engelleme";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `net-varlik-limit-carpani-toplu-guncelleme-gecersiz-veri-${Date.now()}.html`);
const TMP_XLSX_PATH = path.join(__dirname, "..", "..", "tmp", `toplu-guncelleme-gecersiz-react-${Date.now()}.xlsx`);

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

    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Hisse Risk Parametreleri sayfasi acildi", `${BASE_URL}/risk/hisse-risk-parametreleri`);

    await clickButtonByText(page, "Toplu Net Varlik Limit Carpani Guncelleme");
    await new Promise((r) => setTimeout(r, 400));

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      report.fail("Dosya input'u bulunamadi", "input[type=file] DOM'da yok", { diagnostics: diagnostics.getLogs() });
    } else {
      await fileInput.uploadFile(TMP_XLSX_PATH);
      await new Promise((r) => setTimeout(r, 1200));
      report.pass("Gecersiz Excel dosyasi yuklendi", TMP_XLSX_PATH);
    }

    // --- Onizleme tablosunda "Gecersiz Deger" beklenir ---
    const previewScreenshot = await page.screenshot();
    const onizlemeRows = await getDialogPreviewRows(page);
    const gecersizRow = onizlemeRows.find((cells) => cells.join(" | ").includes(HESAP_NO) && cells.join(" | ").includes("Gecersiz Deger"));
    if (gecersizRow) {
      report.pass("Onizleme tablosu satiri gecersiz olarak isaretledi", gecersizRow.join(" | "), { screenshot: previewScreenshot });
    } else {
      report.fail("Onizleme tablosunda 'Gecersiz Deger' satiri bulunamadi", JSON.stringify(onizlemeRows), { screenshot: previewScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Uyari metni gorunur olmali ---
    const dialogText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.textContent ?? "");
    if (dialogText.includes("Onaya Gonder icin oncelikle")) {
      report.pass("Uyari metni goruntulendi", "'Onaya Gonder icin oncelikle...' metni dialogda bulundu");
    } else {
      report.fail("Uyari metni goruntulenmedi", "Beklenen uyari metni dialogda yok", { diagnostics: diagnostics.getLogs() });
    }

    // --- "Onaya Gonder" butonu disabled olmali ---
    const onayaGonderDisabled = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return null;
      const btn = Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent.trim() === "Onaya Gonder");
      return btn ? btn.disabled : null;
    });
    if (onayaGonderDisabled === true) {
      report.pass("Onaya Gonder butonu disabled", "buton devre disi, tiklanamaz durumda");
    } else {
      report.fail("Onaya Gonder butonu disabled DEGIL", `disabled degeri: ${onayaGonderDisabled}`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Yine de tiklamayi dene (gercek kullanici hatasi senaryosu) - hicbir etkisi olmamali ---
    await clickButtonByText(page, "Onaya Gonder").catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const toastAfterClick = await page.evaluate(() => {
      const el = document.querySelector("[data-sonner-toast]");
      return el ? el.textContent.trim() : null;
    });
    if (!toastAfterClick || !toastAfterClick.includes("risk profili guncellendi")) {
      report.pass("Disabled butona tiklama hicbir islem tetiklemedi", "basari toast'i gorunmedi");
    } else {
      report.fail("Disabled buton yine de bir islemi tetikledi", toastAfterClick);
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
    const crashReport = new ScenarioReport(`${SCENARIO_NAME} (CRASH)`);
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
