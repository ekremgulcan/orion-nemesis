/**
 * Senaryo: Musteri Bildirim Tercihleri (React: /crm/musteri-bildirim-tercihleri,
 * MusteriBildirimTercihleriPage.tsx) ekraninda kapsamli fonksiyonel test -
 * ZK karsiligi (screens/zk/musteri-bildirim-tercihleri-guncelleme.cjs) ile
 * ayni senaryo/DB tablosu:
 *   1. Var olmayan bir Musteri No aranir -> hata mesaji gorunur, tercih
 *      paneli gizli kalir.
 *   2. Var olan bir Musteri No aranir -> Musteri Bilgileri karti ve 7
 *      satirlik bildirim tercihi tablosu gorunur.
 *   3. VIOP Margin Call satirinin 3 kanalinin da (Push/SMS/E-Posta)
 *      kilitli/disabled oldugu dogrulanir.
 *   4. Duzenlenebilir bir satirin (Emrinizin Tamami Gerceklesti) Push ve
 *      SMS tercihleri kapatilir, "Onaya Gonder" ile kaydedilir -> toast +
 *      veritabaninda push_acik=0/sms_acik=0 dogrulanir.
 *   5. Sayfa yeniden yuklenip ayni musteri tekrar aranir -> degisikligin
 *      kalici oldugu dogrulanir (ayri bir onay ekrani yok).
 *   6. Teardown: tercih varsayilan (hepsi acik) durumuna UI uzerinden
 *      geri alinir ve veritabaninda dogrulanir.
 *
 * Kullanim: node screens/react/musteri-bildirim-tercihleri-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:5173)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { waitForToast, setSwitchByIndex, getSwitchStates } = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `musteri-bildirim-tercihleri-guncelleme-${Date.now()}.html`);

const MEVCUT_MUSTERI_NO = "M000005";
const OLMAYAN_MUSTERI_NO = "M999999";

// CustomerLookupCard'in "Musteri No" input'u sayfanin ilk (ve tek) data-slot
// input'u; ayri bir dialog yok, bu yuzden root:null (bkz. dom-notes.md).
async function musteriAra(page, musteriNo) {
  const input = (await page.$$('[data-slot="input"]'))[0];
  await input.click({ clickCount: 3 });
  await input.type(musteriNo);
  // CustomerLookupCard'in Input'u Enter'da onSearch() cagirir - ikon-only
  // arama butonunu DOM sirasiyla ayirt etmeye gerek kalmaz.
  await input.press("Enter");
}

async function run() {
  const report = new ScenarioReport("Musteri Bildirim Tercihleri (React) - Kapsamli Test");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac ---
    await page.goto(`${BASE_URL}/crm/musteri-bildirim-tercihleri`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    report.pass("Musteri Bildirim Tercihleri ekrani acildi", `${BASE_URL}/crm/musteri-bildirim-tercihleri`, { screenshot: await page.screenshot() });

    // --- Adim 2: Olmayan Musteri No ara -> hata mesaji ---
    await musteriAra(page, OLMAYAN_MUSTERI_NO);
    await new Promise((r) => setTimeout(r, 1000));
    const notFoundBody = await page.evaluate(() => document.body.innerText);
    const notFoundScreenshot = await page.screenshot();
    if (notFoundBody.includes(`Musteri bulunamadi: ${OLMAYAN_MUSTERI_NO}`)) {
      report.pass("Olmayan musteri icin hata mesaji goruldu", `Musteri bulunamadi: ${OLMAYAN_MUSTERI_NO}`, { screenshot: notFoundScreenshot });
    } else {
      report.fail("Olmayan musteri icin beklenen hata mesaji goruntenmedi", notFoundBody.slice(0, 300), { screenshot: notFoundScreenshot, diagnostics: diagnostics.getLogs() });
    }
    const panelVisibleOnError = notFoundBody.includes("Bildirim Tercihleri (Bildirim Tipi Bazinda)");
    if (!panelVisibleOnError) {
      report.pass("Hata durumunda tercih paneli gizli", "Panel DOM'da gorunmuyor");
    } else {
      report.fail("Hata durumunda tercih paneli hala gorunuyor", "Beklenmedik sekilde panel goruntulendi", { screenshot: notFoundScreenshot });
    }

    // --- Adim 3: Var olan Musteri No ara -> panel + tablo ---
    await musteriAra(page, MEVCUT_MUSTERI_NO);
    await new Promise((r) => setTimeout(r, 1000));
    const foundBody = await page.evaluate(() => document.body.innerText);
    const foundScreenshot = await page.screenshot();
    if (foundBody.includes("Bildirim Tercihleri (Bildirim Tipi Bazinda)") && foundBody.includes("VIOP Margin Call")) {
      report.pass("Musteri bulundu, tercih tablosu goruntulendi", `Musteri No: ${MEVCUT_MUSTERI_NO}`, { screenshot: foundScreenshot });
    } else {
      report.fail("Musteri bulunduktan sonra tercih tablosu goruntulenmedi", foundBody.slice(0, 300), { screenshot: foundScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 4: VIOP Margin Call satirinin kilitli oldugunu dogrula ---
    // DOM sirasi: 7 satir x 3 switch (Push, SMS, E-Posta) = 21 switch; son
    // 3 tane (index 18-20) VIOP Margin Call satirina ait.
    const statesBefore = await getSwitchStates(page);
    if (statesBefore.length === 21 && statesBefore.slice(18, 21).every((s) => s.disabled)) {
      report.pass("VIOP Margin Call satiri kilitli (disabled)", "index 18-20 tumu disabled=true");
    } else {
      report.fail("VIOP Margin Call satiri kilitli degil veya switch sayisi beklenenden farkli", JSON.stringify(statesBefore));
    }

    // --- Adim 5: Duzenlenebilir ilk satirin Push/SMS tercihini kapat ---
    await setSwitchByIndex(page, 0, false);
    await setSwitchByIndex(page, 1, false);
    const toggledScreenshot = await page.screenshot();
    report.pass("Ilk satirin Push ve SMS tercihi kapatildi", "Emrinizin Tamami Gerceklesti: Push=Kapali, SMS=Kapali", { screenshot: toggledScreenshot });

    // "Onaya Gonder" - tek eslesen buton, DOM sirasi/text ile bulunur
    const sendButtons = await page.$$("button");
    let clicked = false;
    for (const b of sendButtons) {
      const t = await page.evaluate((el) => el.textContent.trim(), b);
      if (t.includes("Onaya Gonder")) {
        await b.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('"Onaya Gonder" butonu bulunamadi');
    const toastText = await waitForToast(page);
    const savedScreenshot = await page.screenshot();
    if (toastText && toastText.includes("kaydedildi")) {
      report.pass("Basari toast'i goruldu", toastText, { screenshot: savedScreenshot });
    } else {
      report.fail("Basari toast'i goruntenmedi", `Alinan: ${toastText}`, { screenshot: savedScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 6: Veritabaninda dogrula ---
    const dbQuery =
      "SELECT c.musteri_no, nt.kod, t.push_acik, t.sms_acik, t.eposta_acik FROM musteri_bildirim_tercihleri t " +
      "JOIN customers c ON c.customer_id = t.customer_id JOIN notification_types nt ON nt.notification_type_id = t.notification_type_id " +
      `WHERE c.musteri_no = '${MEVCUT_MUSTERI_NO}' AND nt.kod = 'FILLED';`;
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
    await new Promise((r) => setTimeout(r, 1000));
    const statesAfterReload = await getSwitchStates(page);
    const reloadScreenshot = await page.screenshot();
    if (statesAfterReload[0]?.checked === false && statesAfterReload[1]?.checked === false && statesAfterReload[2]?.checked === true) {
      report.pass("Yeniden yuklemeden sonra tercih degisikligi kalici", "Push=Kapali, SMS=Kapali, E-Posta=Acik", { screenshot: reloadScreenshot });
    } else {
      report.fail("Yeniden yuklemeden sonra tercih degisikligi kaybolmus", JSON.stringify(statesAfterReload.slice(0, 3)), { screenshot: reloadScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 8 (Teardown): Push/SMS'i tekrar ac, varsayilan duruma don ---
    await setSwitchByIndex(page, 0, true);
    await setSwitchByIndex(page, 1, true);
    const sendButtons2 = await page.$$("button");
    for (const b of sendButtons2) {
      const t = await page.evaluate((el) => el.textContent.trim(), b);
      if (t.includes("Onaya Gonder")) {
        await b.click();
        break;
      }
    }
    await waitForToast(page);
    await new Promise((r) => setTimeout(r, 500));

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
    const crashReport = new ScenarioReport("Musteri Bildirim Tercihleri (React) - Kapsamli Test (CRASH)");
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
