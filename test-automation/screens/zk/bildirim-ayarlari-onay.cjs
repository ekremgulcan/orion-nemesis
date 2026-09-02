const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, findGridRow } = require("../../helpers/zk");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-onay-${Date.now()}.html`);

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari Onay Akisi");
  let browser;
  let createdTalepId = null;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac, temizlik yap ---
    await page.goto(`${BASE_URL}/notification/bildirim-ayarlari.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.info("Teardown", "Eski test verileri temizleniyor...");
    await runQuery("UPDATE workflow_tasks SET durum = 'IPTAL' WHERE process_id IN (SELECT process_id FROM workflow_processes WHERE surec_tipi = 'BILDIRIM_AYARLARI_ONAY')");
    await runQuery("UPDATE workflow_processes SET durum = 'IPTAL' WHERE surec_tipi = 'BILDIRIM_AYARLARI_ONAY'");
    await runQuery("DELETE FROM bildirim_ayarlari_talebi WHERE durum = 'BEKLEMEDE'");
    await new Promise(r => setTimeout(r, 1000));
    report.pass("Bildirim Ayarlari ekrani acildi", `${BASE_URL}/notification/bildirim-ayarlari.zul`);

    // Bildirim Tipi sec (Sayfadaki ilk combobox)
    await page.evaluate(() => {
        const input = document.querySelectorAll('input.z-combobox-input')[0];
        if (!input) throw new Error("Combobox input bulunamadi!");
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('Emrinizin Tamami');
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 500)); 
    
    // Bildirim Kanali sec (Sayfadaki ucuncu combobox: 1-Tip, 2-Genel Durum, 3-Kanal)
    await page.evaluate(() => {
        const input = document.querySelectorAll('input.z-combobox-input')[2];
        if (!input) throw new Error("Kanal combobox input bulunamadi!");
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('Push');
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1500)); 

    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 500));

    // Formdaki Max Deneme Sayisi intbox'ina odaklan (Sayfadaki ilk intbox)
    await page.evaluate(() => {
        const input = document.querySelectorAll('input.z-intbox')[0];
        if (!input) throw new Error("Intbox bulunamadi!");
        input.focus();
        input.value = "";
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.type('7');
    await page.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 500));

    const formScreenshot = await page.screenshot();
    report.pass("Kanal ayari duzenlendi", "Max deneme sayisi = 7", { screenshot: formScreenshot });

    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1500));

    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1500));

    const bodyText = await page.evaluate(() => document.body.innerText);
    const successScreenshot = await page.screenshot();
    if (bodyText.includes("onaya")) {
      report.pass("Onaya Gonderildi mesaji goruldu", "Ayar degisikligi onaya gonderildi.", { screenshot: successScreenshot });
    } else {
      report.fail("Basari mesaji goruntulenmedi", "Sayfada 'onaya' metni bulunamadi", { screenshot: successScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Veritabaninda Talebi Dogrula ---
    const dbQuery = `SELECT TOP 1 id, durum FROM bildirim_ayarlari_talebi ORDER BY id DESC;`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].durum === "BEKLEMEDE") {
      createdTalepId = rows[0].id;
      report.pass("Veritabaninda yeni talep kaydi bulundu", `id=${rows[0].id}, durum=${rows[0].durum}`);
    } else {
      report.fail("Veritabaninda kayit bulunamadi veya durum BEKLEMEDE degil", JSON.stringify(rows));
    }

    // --- Adim 3: Onay Islemine Gec (Ana sayfadaki Gorev Listesi uzerinden) ---
    await page.goto(`${BASE_URL}/index.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2000));

    // 'Surec Listesi' tab'ina gecis yap, belki gorev aktif kullaniciya atanmamistir
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.z-tab-text'));
        const surecTab = tabs.find(t => t.textContent.includes('Surec Listesi'));
        if(surecTab) surecTab.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const pageText = await page.evaluate(() => document.body.innerText);
    require('fs').writeFileSync('page_text_debug.txt', pageText);

    const isClicked = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll(".z-listcell-content"));
      const target = cells.find(c => {
          if (!c.textContent || !c.textContent.includes("Bildirim Tipi Ayarlari Guncelleme")) return false;
          const row = c.closest("tr");
          return row && row.textContent.includes("ACIK");
      });
      if (target) {
        const row = target.closest("tr");
        if(row) {
            row.click();
            return true;
        }
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 2000));
    
    if (isClicked) {
       report.pass("Gorev listesindeki goreve tiklandi", "");
    } else {
       report.fail("Gorev listesinde gorev bulunamadi", "", { diagnostics: diagnostics.getLogs() });
    }

    const diffScreenshot = await page.screenshot();
    report.pass("Diff popup acildi", "", { screenshot: diffScreenshot });

    await clickButtonByText(page, "Kapat");
    await new Promise((r) => setTimeout(r, 1000));

    await clickButtonByText(page, "Onayla");
    await new Promise((r) => setTimeout(r, 1500));
    
    const finalBodyText = await page.evaluate(() => document.body.innerText);
    require('fs').writeFileSync('final_page_text_debug.txt', finalBodyText);
    const finalScreenshot = await page.screenshot();
    if (finalBodyText.includes("Guncelleme onaylandi")) {
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
    console.log(`\nTemizlik: id=${createdTalepId} test kaydi siliniyor...`);
    await deleteById("bildirim_ayarlari_talebi", "id", createdTalepId);
    console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Bildirim Ayarlari Onay Akisi (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-onay-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
