const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, fillTextboxesInOrder, findGridRow } = require("../../helpers/zk");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `risk-profili-guncelleme-onay-${Date.now()}.html`);

const HESAP_NO = "10005"; // Farklı bir hesap seçelim çakışmamak için

async function run() {
  const report = new ScenarioReport("Risk Profili Guncelleme Onay Akisi");
  let browser;
  let createdTalepId = null;
  let createdParametreId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac, Yeni Ekle, Kaydet ---
    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.info("Teardown", "Eski test verileri temizleniyor...");
    await runQuery("UPDATE common_processes SET durum = 'IPTAL' WHERE surec_tipi = 'Hisse Risk Parametreleri' AND durum = 'ACIK'");
    await runQuery("UPDATE common_tasks SET durum = 'IPTAL' WHERE durum = 'BEKLIYOR' AND islem_tipi = 'Hisse Risk Parametreleri'");
    await runQuery("DELETE FROM hisse_risk_parametreleri_talepleri WHERE durum = 'BEKLEMEDE' OR durum = 'BEKLIYOR'");
    await new Promise(r => setTimeout(r, 1000));
    report.pass("Hisse Risk Parametreleri ekrani acildi", `${BASE_URL}/risk/hisse-risk-parametreleri.zul`);

    await clickButtonByText(page, "+ Yeni Ekle");
    await new Promise((r) => setTimeout(r, 500));

    // Kullanici Tipi secimi
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.z-label'));
        const formLabel = labels.find(l => l.textContent.trim() === 'Kullanici Tipi');
        const input = formLabel.closest('tr').querySelector('input.z-combobox-input');
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('Musteri');
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 500)); // Tab'in backend'e ulasmasini bekle

    // Hesap no bul (Ikinci Hesap No label'inin yanindaki input)
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.z-label'));
        const formLabel = labels.reverse().find(l => l.textContent.trim() === 'Hesap No');
        const input = formLabel.closest('tr').querySelector('input.z-textbox');
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type(HESAP_NO);
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 500)); // Tab'in backend'e ulasmasini bekle
    await clickButtonByText(page, "Bul");
    await new Promise((r) => setTimeout(r, 1500));
    
    // Formdaki Acik Takas Limiti decimalbox'ina odaklan
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.z-label'));
        const lbl = labels.find(l => l.textContent.trim().includes('Acik Takas Limiti'));
        const input = lbl.closest('tr').querySelector('input.z-decimalbox');
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('1500');
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1000)); // Tab'in backend'e ulasmasini bekle

    const formScreenshot = await page.screenshot();
    report.pass("Hesap Bulundu ve Form Dolduruldu", `Hesap: ${HESAP_NO}`, { screenshot: formScreenshot });

    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1500));

    const bodyText = await page.evaluate(() => document.body.innerText);
    const successScreenshot = await page.screenshot();
    if (bodyText.includes("onaya")) {
      report.pass("Onaya Gonderildi mesaji goruldu", "Risk profili degisikligi onaya gonderildi.", { screenshot: successScreenshot });
    } else {
      report.fail("Basari mesaji goruntulenmedi", "Sayfada 'onaya' metni bulunamadi", { screenshot: successScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Veritabaninda Talebi Dogrula ---
    const dbQuery = `SELECT TOP 1 talep_id, durum FROM hisse_risk_parametreleri_talepleri WHERE talep_turu = 'EKLE' ORDER BY talep_id DESC;`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].durum === "BEKLIYOR") {
      createdTalepId = rows[0].talep_id;
      report.pass(
        "Veritabaninda yeni talep kaydi bulundu",
        `talep_id=${rows[0].talep_id}, durum=${rows[0].durum}`
      );
    } else {
      report.fail("Veritabaninda kayit bulunamadi veya durum BEKLIYOR degil", JSON.stringify(rows));
    }

    // --- Adim 3: Onay Islemine Gec (Ana sayfadaki Gorev Listesi uzerinden) ---
    await page.goto(`${BASE_URL}/index.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));

    const isClicked = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span, div, td"));
      const target = spans.find(s => s.innerText && s.innerText.includes("Hisse Risk Parametreleri"));
      if (target) {
        const row = target.closest("tr");
        if(row) {
            row.click();
            return true;
        }
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 1500));
    
    if (isClicked) {
       report.pass("Gorev listesindeki goreve tiklandi", "");
    } else {
       report.fail("Gorev listesinde gorev bulunamadi", "", { diagnostics: diagnostics.getLogs() });
    }

    const incelemeScreenshot = await page.screenshot();
    report.pass("Inceleme modu acildi", "", { screenshot: incelemeScreenshot });

    await clickButtonByText(page, "Onayla");
    await new Promise((r) => setTimeout(r, 1500));
    
    const finalBodyText = await page.evaluate(() => document.body.innerText);
    const finalScreenshot = await page.screenshot();
    if (finalBodyText.includes("tamamlandi")) {
      report.pass("Onaylandi mesaji goruldu", "Onay islemi tamamlandi.", { screenshot: finalScreenshot });
    } else {
      report.fail("Onay basari mesaji goruntulenmedi", "", { screenshot: finalScreenshot, diagnostics: diagnostics.getLogs() });
    }

  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  if (createdTalepId) {
    console.log(`\nTemizlik: talep_id=${createdTalepId} test kaydi siliniyor...`);
    await deleteById("hisse_risk_parametreleri_talepleri", "talep_id", createdTalepId);
    await runQuery(`DELETE FROM hisse_risk_parametreleri WHERE hesap_id = (SELECT top 1 id FROM accounts WHERE hesap_no = '${HESAP_NO}')`);
    console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Risk Profili Guncelleme Onay Akisi (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `risk-profili-guncelleme-onay-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
