/**
 * Senaryo: Bildirim Izleme (React: /crm/bildirim-izleme) sayfasinda
 * (1) "Bugunku Bildirimler" sekmesinin bugunku kayit sayisiyla,
 * "Gecmis Bildirimler" sekmesinin varsayilan araliginin (bos baslangic,
 * bitis=dun) veritabanindaki gercek kayit sayisiyla eslesip eslesmedigi,
 * (2) sunucu-tarafi sayfalamanin (page/size) "Sonraki"/"Onceki" ile dogru
 * calisip calismadigi (SQLServer2012Dialect gecisinden sonra dogrulanan
 * OFFSET/FETCH duzeltmesi), (3) "Durum" per-column filtresinin dogru
 * satirlari donup dondurmedigi, (4) "Yatirimci No" per-column filtresinin
 * dogru satiri donup dondurmedigi, (5) "Rapor Olustur" butonunun basari
 * toast'i gosterip gostermedigi dogrulanir. Ground truth olarak "gecmis"
 * (log_date <= dun) verisi kullanilir - "bugun" mock verisi seed anina
 * gore sabit oldugundan gun degistikce 0'a duser ve bu senaryo bundan
 * bagimsiz kalmalidir; "Bugunku Bildirimler" adimi da buna gore 0
 * satiri gecerli bir sonuc olarak kabul eder, sabit >0 varsaymaz.
 * Salt-okunur bir izleme ekrani oldugu icin herhangi bir veri
 * olusturulmaz/silinmez - teardown gerektirmez.
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
    // Ground truth for the Gecmis Bildirimler tab: ayni siralama backend'in
    // "order by e.created desc" kuralini birebir yansitir, boylece sayfa 2'nin
    // beklenen event_id'leri de (indeks 20+) buradan cikarilabilir.
    const uptoYesterdayRows = await runQuery(
      "SELECT e.event_id, a.hesap_no FROM notification_events e JOIN accounts a ON a.account_id = e.account_id " +
        "WHERE e.log_date <= DATEADD(day, -1, CAST(SYSUTCDATETIME() AS DATE)) ORDER BY e.created DESC;"
    );
    report.sql(
      "Gecmis Bildirimler varsayilan araligina (bos baslangic, bitis=dun) giren kayitlar alindi",
      "SELECT ... WHERE log_date <= yesterday ORDER BY created DESC",
      uptoYesterdayRows
    );
    const uptoYesterdayFailRows = await runQuery(
      "SELECT event_id, account_id FROM notification_events WHERE log_date <= DATEADD(day, -1, CAST(SYSUTCDATETIME() AS DATE)) AND status = 'FAIL' ORDER BY event_id;"
    );
    report.sql(
      "Gecmis Bildirimler araligindaki FAIL kayitlar alindi",
      "SELECT ... WHERE log_date <= yesterday AND status = 'FAIL'",
      uptoYesterdayFailRows
    );

    if (todayRows.length === 0) {
      report.info("On kosul notu: bugun tarihli mock veri yok", "Bugunku Bildirimler sekmesinin bos gelmesi bekleniyor (0 satir gecerli bir sonuc)");
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

    // --- Adim 2: Gecmis Bildirimler sekmesine gec (varsayilan = bos baslangic, bitis=dun) ---
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
    if (rows.length === Math.min(uptoYesterdayRows.length, 20)) {
      report.pass("Gecmis Bildirimler varsayilan (bos baslangic/dune kadar) satir sayisi DB ile eslesiyor", `${rows.length} satir`);
    } else {
      report.fail(
        "Gecmis Bildirimler varsayilan satir sayisi DB ile eslesmiyor",
        `beklenen ${Math.min(uptoYesterdayRows.length, 20)} (sayfa basi 20), gelen ${rows.length}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 3: Sayfalama ("Sonraki"/"Onceki") - SQLServer2012Dialect duzeltmesinin regresyonu ---
    if (uptoYesterdayRows.length > 20) {
      // Bildirim Id/Sablon Id/Deneme kolonlari tablodan kaldirildi (asiri genislik
      // yuzunden sag paneli oruyordu - bkz. BildirimIzlemePage.tsx yorumu); artik
      // sadece detay panelinde gorunuyorlar. Sayfa 2 kimligini dogrulamak icin
      // "Yatirimci No" (hesap_no, indeks 2) + "created desc" siralamasindaki konum
      // birlikte kullanilir - ayni hesabin birden fazla bildirimi olsa da sira
      // backend'in "order by e.created desc" kuraliyla birebir eslesir.
      const expectedPage2HesapNo = uptoYesterdayRows.slice(20).map((r) => String(r.hesap_no));
      await clickButtonByText(page, "Sonraki");
      await new Promise((r) => setTimeout(r, 800));
      rows = await getTableRows(page);
      const page2Screenshot = await page.screenshot();
      const gottenHesapNo = rows.map((cells) => cells[2]);
      if (rows.length === expectedPage2HesapNo.length && gottenHesapNo.every((id, i) => id === expectedPage2HesapNo[i])) {
        report.pass("Sonraki sayfa (sayfa 2) dogru kayitlari donduruyor", `${rows.length} satir, hesap no'lar: ${gottenHesapNo.join(", ")}`, { screenshot: page2Screenshot });
      } else {
        report.fail(
          "Sonraki sayfa (sayfa 2) beklenen kayitlari donmuyor",
          `beklenen hesap no'lar [${expectedPage2HesapNo.join(", ")}], gelen [${gottenHesapNo.join(", ")}]`,
          { screenshot: page2Screenshot, diagnostics: diagnostics.getLogs() }
        );
      }

      await clickButtonByText(page, "Onceki");
      await new Promise((r) => setTimeout(r, 800));
      rows = await getTableRows(page);
      if (rows.length === Math.min(uptoYesterdayRows.length, 20)) {
        report.pass("Onceki ile sayfa 1'e donuldu", `${rows.length} satir`);
      } else {
        report.fail(
          "Onceki ile sayfa 1'e donulemedi",
          `beklenen ${Math.min(uptoYesterdayRows.length, 20)}, gelen ${rows.length}`,
          { diagnostics: diagnostics.getLogs() }
        );
      }
    } else {
      report.info("Sayfalama adimi atlandi", `Gecmis Bildirimler toplam ${uptoYesterdayRows.length} kayit iceriyor, tek sayfaya sigiyor (sayfa basi 20)`);
    }

    // --- Adim 4: Durum = FAIL per-column filtresi ---
    // 0 = Sayfa Basina Satir (toolbar), 1 = Durum (per-column filtre satiri)
    await selectDropdownByIndex(page, 1, "FAIL");
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 800));
    rows = await getTableRows(page);
    const failFilterScreenshot = await page.screenshot();
    if (rows.length === uptoYesterdayFailRows.length) {
      report.pass("Durum=FAIL filtresi dogru satir sayisini donuyor", `${rows.length} satir`, { screenshot: failFilterScreenshot });
    } else {
      report.fail(
        "Durum=FAIL filtresi yanlis satir sayisi donduruyor",
        `beklenen ${uptoYesterdayFailRows.length}, gelen ${rows.length}`,
        { screenshot: failFilterScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    for (const failRow of uptoYesterdayFailRows) {
      const accountRow = await runQuery(`SELECT hesap_no FROM accounts WHERE account_id = ${failRow.account_id};`);
      const hesapNo = accountRow[0]?.hesap_no;
      const found = hesapNo ? await findTableRow(page, [hesapNo]) : null;
      if (hesapNo && found) {
        report.pass(`Durum=FAIL sonuclarinda hesap ${hesapNo} bulundu`, null);
      } else {
        report.fail(`Durum=FAIL sonuclarinda hesap ${hesapNo ?? failRow.account_id} bulunamadi`, null, { diagnostics: diagnostics.getLogs() });
      }
    }

    // --- Adim 5: Temizle, sonra Yatirimci No filtresi ---
    // "Temizle" formu varsayilan Gecmis Bildirimler araligina sifirlar (bos
    // baslangic, bitis=dun) - beklenen sayi da ayni araliga gore hesaplanir,
    // "bugun" degil (ekranin varsayilaniyla tutarli olsun diye).
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 600));
    const targetAccountId = uptoYesterdayFailRows[0].account_id;
    const targetAccount = await runQuery(`SELECT hesap_no FROM accounts WHERE account_id = ${targetAccountId};`);
    const targetHesapNo = targetAccount[0].hesap_no;
    const expectedForAccount = await runQuery(
      `SELECT COUNT(*) AS cnt FROM notification_events WHERE account_id = ${targetAccountId} AND log_date <= DATEADD(day, -1, CAST(SYSUTCDATETIME() AS DATE));`
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
