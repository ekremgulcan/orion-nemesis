/**
 * Senaryo: Musteri Bildirim Tercihleri (ZK: notification/musteri-bildirim-tercihleri.zul)
 * ekraninda kapsamli fonksiyonel test:
 *   1. Var olmayan bir Musteri No aranir -> hata mesaji gorunur, tercih
 *      paneli gizli kalir.
 *   2. Var olan bir Musteri No aranir -> Musteri Bilgileri paneli ve 6
 *      satirlik bildirim tercihi tablosu gorunur.
 *   3. VIOP Margin Call satirinin 3 kanalinin da (Push/SMS/E-Posta)
 *      kilitli/disabled oldugu dogrulanir (zorunlu bildirim tipi).
 *   4. Duzenlenebilir bir satirin (Emrinizin Tamami Gerceklesti) Push ve
 *      SMS tercihleri kapatilir, "Onaya Gonder" ile kaydedilir -> basari
 *      mesaji + veritabaninda push_acik=0/sms_acik=0 dogrulanir.
 *   5. Sayfa yeniden yuklenip ayni musteri tekrar aranir -> degisikligin
 *      kalici oldugu (ayni ekranda) dogrulanir (bu ekranda ayri bir onay
 *      ekrani yok, tek ekran kendi kendini dogrular).
 *   6. Teardown: tercih varsayilan (hepsi acik) durumuna geri UI
 *      uzerinden geri alinir ve veritabaninda dogrulanir - kalici test
 *      musterisi (M000005) baska senaryolari etkilemesin diye.
 *
 * Kullanim: node screens/zk/musteri-bildirim-tercihleri-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, setCheckboxByIndex, getCheckboxStates } = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `musteri-bildirim-tercihleri-guncelleme-${Date.now()}.html`);

const MEVCUT_MUSTERI_NO = "M000005";
const OLMAYAN_MUSTERI_NO = "M999999";

async function musteriAra(page, musteriNo) {
  const input = (await page.$$("input.z-textbox"))[0];
  await input.click({ clickCount: 3 });
  await input.type(musteriNo);
  await clickButtonByText(page, "Ara"); // arama butonu artik "Ara" etiketli (diger ekranlarla tutarli)
}

async function run() {
  const report = new ScenarioReport("Musteri Bildirim Tercihleri (ZK) - Kapsamli Test");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac ---
    await page.goto(`${BASE_URL}/notification/musteri-bildirim-tercihleri.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    report.pass("Musteri Bildirim Tercihleri ekrani acildi", `${BASE_URL}/notification/musteri-bildirim-tercihleri.zul`, { screenshot: await page.screenshot() });

    // --- Adim 2: Olmayan Musteri No ara -> hata mesaji ---
    await musteriAra(page, OLMAYAN_MUSTERI_NO);
    await new Promise((r) => setTimeout(r, 800));
    const notFoundBody = await page.evaluate(() => document.body.innerText);
    const notFoundScreenshot = await page.screenshot();
    if (notFoundBody.includes(`Musteri bulunamadi: ${OLMAYAN_MUSTERI_NO}`)) {
      report.pass("Olmayan musteri icin hata mesaji goruldu", `Musteri bulunamadi: ${OLMAYAN_MUSTERI_NO}`, { screenshot: notFoundScreenshot });
    } else {
      report.fail("Olmayan musteri icin beklenen hata mesaji goruntenmedi", notFoundBody.slice(0, 300), { screenshot: notFoundScreenshot, diagnostics: diagnostics.getLogs() });
    }
    const panelVisibleOnError = await page.evaluate(() => document.body.innerText.includes("Bildirim Tercihleri (Bildirim Tipi Bazinda)"));
    if (!panelVisibleOnError) {
      report.pass("Hata durumunda tercih paneli gizli", "Panel DOM'da gorunmuyor");
    } else {
      report.fail("Hata durumunda tercih paneli hala gorunuyor", "Beklenmedik sekilde panel goruntulendi", { screenshot: notFoundScreenshot });
    }

    // --- Adim 3: Var olan Musteri No ara -> panel + tablo ---
    await musteriAra(page, MEVCUT_MUSTERI_NO);
    await new Promise((r) => setTimeout(r, 800));
    const foundBody = await page.evaluate(() => document.body.innerText);
    const foundScreenshot = await page.screenshot();
    if (foundBody.includes("Bildirim Tercihleri (Bildirim Tipi Bazinda)") && foundBody.includes("VIOP Margin Call")) {
      report.pass("Musteri bulundu, tercih tablosu goruntulendi", `Musteri No: ${MEVCUT_MUSTERI_NO}`, { screenshot: foundScreenshot });
    } else {
      report.fail("Musteri bulunduktan sonra tercih tablosu goruntulenmedi", foundBody.slice(0, 300), { screenshot: foundScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 4: VIOP Margin Call satirinin kilitli oldugunu dogrula ---
    // DOM sirasi: 6 satir x 3 checkbox (Push, SMS, E-Posta) = 18 checkbox;
    // son 3 tane (index 15-17) VIOP Margin Call satirina ait.
    const statesBefore = await getCheckboxStates(page);
    if (statesBefore.length === 18 && statesBefore.slice(15, 18).every((s) => s.disabled)) {
      report.pass("VIOP Margin Call satiri kilitli (disabled)", "index 15-17 tumu disabled=true");
    } else {
      report.fail("VIOP Margin Call satiri kilitli degil veya checkbox sayisi beklenenden farkli", JSON.stringify(statesBefore));
    }

    // --- Adim 5: Duzenlenebilir ilk satirin Push/SMS tercihini kapat ---
    // index 0 = row0 (Emrinizin Tamami Gerceklesti) Push, index 1 = SMS, index 2 = E-Posta
    await setCheckboxByIndex(page, 0, false);
    await setCheckboxByIndex(page, 1, false);
    const toggledScreenshot = await page.screenshot();
    report.pass("Ilk satirin Push ve SMS tercihi kapatildi", "Emrinizin Tamami Gerceklesti: Push=Kapali, SMS=Kapali", { screenshot: toggledScreenshot });

    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));
    const savedBody = await page.evaluate(() => document.body.innerText);
    const savedScreenshot = await page.screenshot();
    if (savedBody.includes("kaydedildi")) {
      report.pass("Basari mesaji goruldu", savedBody.match(/Bildirim tercihleri kaydedildi[^\n]*/)?.[0], { screenshot: savedScreenshot });
    } else {
      report.fail("Basari mesaji goruntenmedi", "Sayfada 'kaydedildi' metni bulunamadi", { screenshot: savedScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 6: Veritabaninda dogrula ---
    const dbQuery =
      "SELECT c.musteri_no, nt.kod, t.push_acik, t.sms_acik, t.eposta_acik FROM musteri_bildirim_tercihleri t " +
      "JOIN customers c ON c.customer_id = t.customer_id JOIN notification_types nt ON nt.notification_type_id = t.notification_type_id " +
      `WHERE c.musteri_no = '${MEVCUT_MUSTERI_NO}' AND nt.kod = 'EMIR_TAMAMI_GERCEKLESTI';`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].push_acik === "0" && rows[0].sms_acik === "0" && rows[0].eposta_acik === "1") {
      report.pass("Veritabaninda tercih guncellemesi dogrulandi", `push_acik=0, sms_acik=0, eposta_acik=1 (${MEVCUT_MUSTERI_NO})`);
    } else {
      report.fail("Veritabaninda beklenen tercih degerleri bulunamadi", JSON.stringify(rows), { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 7: Sayfayi yenile, ayni musteriyi tekrar ara -> kalicilik dogrulamasi ---
    await page.reload({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    await musteriAra(page, MEVCUT_MUSTERI_NO);
    await new Promise((r) => setTimeout(r, 800));
    const statesAfterReload = await getCheckboxStates(page);
    const reloadScreenshot = await page.screenshot();
    if (statesAfterReload[0]?.checked === false && statesAfterReload[1]?.checked === false && statesAfterReload[2]?.checked === true) {
      report.pass("Yeniden yuklemeden sonra tercih degisikligi kalici", "Push=Kapali, SMS=Kapali, E-Posta=Acik", { screenshot: reloadScreenshot });
    } else {
      report.fail("Yeniden yuklemeden sonra tercih degisikligi kaybolmus", JSON.stringify(statesAfterReload.slice(0, 3)), { screenshot: reloadScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 8 (Teardown): Push/SMS'i tekrar ac, varsayilan duruma don ---
    await setCheckboxByIndex(page, 0, true);
    await setCheckboxByIndex(page, 1, true);
    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));

    const teardownRows = await runQuery(dbQuery);
    if (teardownRows.length === 1 && teardownRows[0].push_acik === "1" && teardownRows[0].sms_acik === "1") {
      report.pass("Teardown: tercih varsayilan (hepsi acik) durumuna geri alindi", `${MEVCUT_MUSTERI_NO} / EMIR_TAMAMI_GERCEKLESTI`);
    } else {
      report.fail("Teardown basarisiz: tercih varsayilan duruma donmedi", JSON.stringify(teardownRows));
    }
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
    const crashReport = new ScenarioReport("Musteri Bildirim Tercihleri (ZK) - Kapsamli Test (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `musteri-bildirim-tercihleri-guncelleme-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
