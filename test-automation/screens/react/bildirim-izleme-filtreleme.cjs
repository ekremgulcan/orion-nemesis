/**
 * Senaryo: Bildirim Izleme (React: /crm/bildirim-izleme) sayfasinda
 * (1) "Bugunku Bildirimler" ve "Gecmis Bildirimler" sekmelerinin
 * varsayilan (bugun tarih araligi) satir sayisinin veritabanindaki
 * gercek bugunku kayit sayisiyla eslesip eslesmedigi, (2) "Durum"
 * per-column filtresinin dogru satirlari donup dondurmedigi, (3)
 * "Yatirimci No" per-column filtresinin dogru satiri donup dondurmedigi,
 * (4) "Rapor Olustur" butonunun basari toast'i gosterip gostermedigi
 * dogrulanir. Salt-okunur bir izleme ekrani oldugu icin herhangi bir
 * veri olusturulmaz/silinmez - teardown gerektirmez.
 *
 * Kullanim: node screens/react/bildirim-izleme-filtreleme.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, getTableRows, findTableRow, selectDropdownByIndex, waitForToast } = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-izleme-filtreleme-${Date.now()}.html`);

/**
 * Fills the Nth [data-slot="input"] that is NOT a type="date" field.
 * Needed because this screen's toolbar has two date inputs (Baslangic/
 * Bitis) ahead of the per-column text filters in DOM order, and both
 * use the same shadcn Input component/data-slot - see dom-notes.md.
 * Deliberately NOT added to the shared fillInputsInOrder helper since
 * an existing script (nakit-islem-giris-yeni-talep.cjs) already counts
 * indices against its current (unfiltered) behavior.
 */
async function fillNthNonDateInput(page, index, value) {
  const handle = await page.evaluateHandle((idx) => {
    const inputs = Array.from(document.querySelectorAll('[data-slot="input"]')).filter(
      (i) => i.getAttribute("type") !== "date"
    );
    return inputs[idx] || null;
  }, index);
  const el = handle.asElement();
  if (!el) throw new Error(`fillNthNonDateInput: no non-date input found at index ${index}`);
  await el.click({ clickCount: 3 });
  await el.type(value);
}

async function run() {
  const report = new ScenarioReport("Bildirim Izleme (React) - Filtreleme ve Rapor Olustur");
  let browser;

  try {
    const todayRows = await runQuery(
      "SELECT event_id, account_id FROM notification_events WHERE log_date = CAST(SYSUTCDATETIME() AS DATE) ORDER BY event_id;"
    );
    report.sql("Bugunku kayitlar veritabanindan alindi", "SELECT ... WHERE log_date = CAST(SYSUTCDATETIME() AS DATE)", todayRows);
    const todayFailRows = await runQuery(
      "SELECT event_id, account_id FROM notification_events WHERE log_date = CAST(SYSUTCDATETIME() AS DATE) AND status = 'FAIL' ORDER BY event_id;"
    );
    report.sql("Bugunku FAIL kayitlar veritabanindan alindi", "SELECT ... WHERE log_date = today AND status = 'FAIL'", todayFailRows);

    if (todayRows.length === 0) {
      report.fail("On kosul: bugun tarihli mock veri yok", "notification_events tablosunda bugune ait kayit bulunamadi");
      throw new Error("Bugun tarihli veri yok, senaryo devam edemez");
    }

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Bugunku Bildirimler (varsayilan aktif sekme) ---
    await page.goto(`${BASE_URL}/crm/bildirim-izleme`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    let rows = await getTableRows(page);
    const bugunScreenshot = await page.screenshot();
    if (rows.length === todayRows.length) {
      report.pass("Bugunku Bildirimler satir sayisi DB ile eslesiyor", `${rows.length} satir`, { screenshot: bugunScreenshot });
    } else {
      report.fail(
        "Bugunku Bildirimler satir sayisi DB ile eslesmiyor",
        `beklenen ${todayRows.length}, gelen ${rows.length}`,
        { screenshot: bugunScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 2: Gecmis Bildirimler sekmesine gec (varsayilan = bugun araligi) ---
    const switched = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Gecmis Bildirimler"));
      if (!btn) return false;
      btn.click();
      return true;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (switched) {
      report.pass("Gecmis Bildirimler sekmesine gecildi", null);
    } else {
      report.fail("Gecmis Bildirimler sekmesine gecilemedi", "'button' icinde beklenen metin bulunamadi", { diagnostics: diagnostics.getLogs() });
    }

    rows = await getTableRows(page);
    if (rows.length === todayRows.length) {
      report.pass("Gecmis Bildirimler varsayilan (bugun) satir sayisi DB ile eslesiyor", `${rows.length} satir`);
    } else {
      report.fail(
        "Gecmis Bildirimler varsayilan satir sayisi DB ile eslesmiyor",
        `beklenen ${todayRows.length}, gelen ${rows.length}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 3: Durum = FAIL per-column filtresi ---
    // 0 = Sayfa Basina Satir (toolbar), 1 = Durum (per-column filtre satiri)
    await selectDropdownByIndex(page, 1, "FAIL");
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 800));
    rows = await getTableRows(page);
    const failFilterScreenshot = await page.screenshot();
    if (rows.length === todayFailRows.length) {
      report.pass("Durum=FAIL filtresi dogru satir sayisini donuyor", `${rows.length} satir`, { screenshot: failFilterScreenshot });
    } else {
      report.fail(
        "Durum=FAIL filtresi yanlis satir sayisi donduruyor",
        `beklenen ${todayFailRows.length}, gelen ${rows.length}`,
        { screenshot: failFilterScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    for (const failRow of todayFailRows) {
      const accountRow = await runQuery(`SELECT hesap_no FROM accounts WHERE account_id = ${failRow.account_id};`);
      const hesapNo = accountRow[0]?.hesap_no;
      const found = hesapNo ? await findTableRow(page, [hesapNo]) : null;
      if (hesapNo && found) {
        report.pass(`Durum=FAIL sonuclarinda hesap ${hesapNo} bulundu`, null);
      } else {
        report.fail(`Durum=FAIL sonuclarinda hesap ${hesapNo ?? failRow.account_id} bulunamadi`, null, { diagnostics: diagnostics.getLogs() });
      }
    }

    // --- Adim 4: Temizle, sonra Yatirimci No filtresi ---
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 600));
    const targetAccount = await runQuery(`SELECT hesap_no FROM accounts WHERE account_id = ${todayFailRows[0].account_id};`);
    const targetHesapNo = targetAccount[0].hesap_no;
    const expectedForAccount = await runQuery(
      `SELECT COUNT(*) AS cnt FROM notification_events WHERE account_id = ${todayFailRows[0].account_id} AND log_date = CAST(SYSUTCDATETIME() AS DATE);`
    );
    await fillNthNonDateInput(page, 0, targetHesapNo); // 0 = Yatirimci No (ilk gorunen date-olmayan input)
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 800));
    rows = await getTableRows(page);
    const expectedCount = Number(expectedForAccount[0].cnt);
    if (rows.length === expectedCount) {
      report.pass(`Yatirimci No=${targetHesapNo} filtresi dogru satir sayisini donuyor`, `${rows.length} satir`);
    } else {
      report.fail(
        `Yatirimci No=${targetHesapNo} filtresi yanlis satir sayisi donduruyor`,
        `beklenen ${expectedCount}, gelen ${rows.length}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 5: Rapor Olustur ---
    await clickButtonByText(page, "Rapor Olustur");
    const toast = await waitForToast(page, 5000);
    const raporScreenshot = await page.screenshot();
    if (toast === "Rapor olusturuldu.") {
      report.pass("Rapor Olustur basari toast'i gosterildi", toast, { screenshot: raporScreenshot });
    } else {
      report.fail("Rapor Olustur beklenen basari toast'ini gostermedi", `gelen toast: "${toast}"`, { screenshot: raporScreenshot, diagnostics: diagnostics.getLogs() });
    }

    await page.close();
  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);
  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Bildirim Izleme (React) - Filtreleme ve Rapor Olustur (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-izleme-filtreleme-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
