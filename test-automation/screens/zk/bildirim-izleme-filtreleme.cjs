/**
 * Senaryo: Bildirim Izleme (ZK: notification/bildirim-izleme.zul)
 * ekraninda (1) "Bugunku Bildirimler" sekmesinin bugunku kayit
 * sayisiyla, "Gecmis Bildirimler" sekmesinin varsayilan araliginin
 * (bos baslangic, bitis=dun) veritabanindaki gercek kayit sayisiyla
 * eslesip eslesmedigi,
 * (2) "Durum" filtresinin dogru satirlari donup dondurmedigi, (3)
 * "Yatirimci No" filtresinin dogru satiri donup dondurmedigi, (4)
 * "Rapor Olustur" butonunun basari bildirimi gosterip gostermedigi
 * dogrulanir. Salt-okunur bir izleme ekrani oldugu icin herhangi bir
 * veri olusturulmaz/silinmez - teardown gerektirmez.
 *
 * Kullanim: node screens/zk/bildirim-izleme-filtreleme.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, selectComboboxByIndex, getVisibleGridRows, findVisibleGridRow } = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-izleme-filtreleme-${Date.now()}.html`);

async function switchToGecmisTab(page) {
  return page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll(".z-tab"));
    const target = tabs.find((t) => t.textContent.includes("Gecmis Bildirimler"));
    if (!target) return false;
    target.click();
    return true;
  });
}

/**
 * Fills the Nth VISIBLE plain z-textbox (needed since this screen's
 * form is inside a tabpanel alongside a hidden sibling that also has
 * no textboxes, but the pattern is documented for future multi-tab
 * screens with textboxes in more than one tab). Presses Tab afterwards
 * to force ZK's @bind to sync before the next click (see dom-notes.md).
 */
async function fillVisibleTextbox(page, index, value) {
  const handle = await page.evaluateHandle((idx) => {
    const inputs = Array.from(document.querySelectorAll("input.z-textbox")).filter((i) => i.offsetParent !== null);
    return inputs[idx] || null;
  }, index);
  const el = handle.asElement();
  if (!el) throw new Error(`fillVisibleTextbox: no visible textbox at index ${index}`);
  await el.click({ clickCount: 3 });
  await el.type(value);
  await page.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 200));
}

async function run() {
  const report = new ScenarioReport("Bildirim Izleme (ZK) - Filtreleme ve Rapor Olustur");
  let browser;

  try {
    // --- Beklenen degerleri veritabanindan al (UI'dan bagimsiz ground truth) ---
    const todayRows = await runQuery(
      "SELECT event_id, account_id FROM notification_events WHERE log_date = CAST(SYSUTCDATETIME() AS DATE) ORDER BY event_id;"
    );
    report.sql("Bugunku kayitlar veritabanindan alindi", "SELECT ... WHERE log_date = CAST(SYSUTCDATETIME() AS DATE)", todayRows);
    const todayFailRows = await runQuery(
      "SELECT event_id, account_id FROM notification_events WHERE log_date = CAST(SYSUTCDATETIME() AS DATE) AND status = 'FAIL' ORDER BY event_id;"
    );
    report.sql("Bugunku FAIL kayitlar veritabanindan alindi", "SELECT ... WHERE log_date = today AND status = 'FAIL'", todayFailRows);
    const uptoYesterdayRows = await runQuery(
      "SELECT event_id FROM notification_events WHERE log_date <= DATEADD(day, -1, CAST(SYSUTCDATETIME() AS DATE));"
    );
    report.sql(
      "Gecmis Bildirimler varsayilan araligina (bos baslangic, bitis=dun) giren kayitlar alindi",
      "SELECT ... WHERE log_date <= yesterday",
      uptoYesterdayRows
    );

    if (todayRows.length === 0) {
      report.fail(
        "On kosul: bugun tarihli mock veri yok",
        "notification_events tablosunda bugune ait kayit bulunamadi - V32/V33 seed migration'lari calismis mi kontrol et"
      );
      throw new Error("Bugun tarihli veri yok, senaryo devam edemez");
    }

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Bugunku Bildirimler (varsayilan aktif sekme) ---
    await page.goto(`${BASE_URL}/notification/bildirim-izleme.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    let rows = await getVisibleGridRows(page);
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

    // --- Adim 2: Gecmis Bildirimler sekmesine gec (varsayilan = bos baslangic, bitis=dun) ---
    const switched = await switchToGecmisTab(page);
    await new Promise((r) => setTimeout(r, 600));
    if (switched) {
      report.pass("Gecmis Bildirimler sekmesine gecildi", null);
    } else {
      report.fail("Gecmis Bildirimler sekmesine gecilemedi", "'.z-tab' icinde beklenen metin bulunamadi", { diagnostics: diagnostics.getLogs() });
    }

    rows = await getVisibleGridRows(page);
    const expectedGecmisDefaultCount = Math.min(uptoYesterdayRows.length, 20); // pageSize=20 varsayilani
    if (rows.length === expectedGecmisDefaultCount) {
      report.pass("Gecmis Bildirimler varsayilan (bos baslangic/dune kadar) satir sayisi DB ile eslesiyor", `${rows.length} satir`);
    } else {
      report.fail(
        "Gecmis Bildirimler varsayilan satir sayisi DB ile eslesmiyor",
        `beklenen ${expectedGecmisDefaultCount} (sayfa basi 20), gelen ${rows.length}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 3: Durum = FAIL filtresi ---
    await selectComboboxByIndex(page, 0, "FAIL"); // 0 = Durum (tek gorunen combobox, Sayfa Basina Satir haric)
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 600));
    rows = await getVisibleGridRows(page);
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
      const found = hesapNo ? await findVisibleGridRow(page, [hesapNo]) : null;
      if (hesapNo && found) {
        report.pass(`Durum=FAIL sonuclarinda hesap ${hesapNo} bulundu`, null);
      } else {
        report.fail(`Durum=FAIL sonuclarinda hesap ${hesapNo ?? failRow.account_id} bulunamadi`, null, { diagnostics: diagnostics.getLogs() });
      }
    }

    // --- Adim 4: Temizle, sonra Yatirimci No filtresi (ilk bugunku FAIL kaydin hesabi) ---
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 600));
    const targetAccount = await runQuery(`SELECT hesap_no FROM accounts WHERE account_id = ${todayFailRows[0].account_id};`);
    const targetHesapNo = targetAccount[0].hesap_no;
    const expectedForAccount = await runQuery(
      `SELECT COUNT(*) AS cnt FROM notification_events WHERE account_id = ${todayFailRows[0].account_id} AND log_date = CAST(SYSUTCDATETIME() AS DATE);`
    );
    await fillVisibleTextbox(page, 0, targetHesapNo); // 0 = Yatirimci No (ilk gorunen textbox)
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 600));
    rows = await getVisibleGridRows(page);
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
    await new Promise((r) => setTimeout(r, 800));
    const growlFound = await page.evaluate(() => document.body.textContent.includes("Rapor olusturuldu"));
    const raporScreenshot = await page.screenshot();
    if (growlFound) {
      report.pass("Rapor Olustur basari bildirimi gosterildi", null, { screenshot: raporScreenshot });
    } else {
      report.fail("Rapor Olustur basari bildirimi gosterilmedi", null, { screenshot: raporScreenshot, diagnostics: diagnostics.getLogs() });
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
    const crashReport = new ScenarioReport("Bildirim Izleme (ZK) - Filtreleme ve Rapor Olustur (CRASH)");
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
