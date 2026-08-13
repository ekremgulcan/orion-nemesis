/**
 * Senaryo: Bildirim Ayarlari (ZK: notification/bildirim-ayarlari.zul)
 * ekraninda kapsamli fonksiyonel test - su an sadece ekranin ilk iki
 * bolumu uygulandi (bildirim tipi secimi + kanallardan bagimsiz genel
 * durum); kanal secildikten sonraki sablon/parametre/diger-ayarlar
 * bolumu henuz yok, bu yuzden bu senaryo sadece yer tutucu mesaji
 * dogrular:
 *   1. Ekran ilk acildiginda "Bildirim Tipi Secimi" basligi ve "devam
 *      etmek icin bildirim tipi seciniz" mesaji gorunur; Durum ve
 *      Bildirim Kanali alanlari henuz gorunmez.
 *   2. Duzenlenebilir bir bildirim tipi (Emrinizin Durumunda Degisiklik
 *      Oldu / PARTIALLY_FILLED) secilir -> baslik "Bildirim Tipi ve Genel
 *      Durum" olur, Durum ve Bildirim Kanali alanlari gorunur, Durum
 *      mevcut degeri (Acik) dogru yansitir.
 *   3. Durum "Kapali" yapilir, "Onaya Gonder" ile kaydedilir -> basari
 *      mesaji + veritabaninda is_active=0 dogrulanir.
 *   4. Sayfa yeniden yuklenip ayni tip tekrar secilir -> degisikligin
 *      kalici oldugu (Durum hala Kapali gorunur) dogrulanir.
 *   5. Bildirim Kanali secilir (Mobil) -> henuz uygulanmamis kanal bazli
 *      bolum icin yer tutucu mesaj gorunur.
 *   6. Baska bir bildirim tipi secilince kanal seciminin sifirlandigi
 *      (yer tutucu mesajin kaybolup "kanal seciniz" mesajinin geri
 *      geldigi) dogrulanir.
 *   7. Teardown: Durum tekrar "Acik" yapilir ve kaydedilir, veritabaninda
 *      dogrulanir - kalici referans veri (PARTIALLY_FILLED) baska
 *      senaryolari etkilemesin diye.
 *
 * Kullanim: node screens/zk/bildirim-ayarlari-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, selectComboboxByIndex, getComboboxValues } = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-guncelleme-${Date.now()}.html`);

const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED, zorunlu degil
const DIGER_TIP_ADI = "VIOP Margin Call Bildirimi"; // sadece kanal-sifirlama testi icin secilir, durumu degistirilmez
const DB_QUERY = "SELECT is_active FROM notification_types WHERE kod = 'PARTIALLY_FILLED';";

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari (ZK) - Kapsamli Test");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac, ilk durumu dogrula ---
    await page.goto(`${BASE_URL}/notification/bildirim-ayarlari.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    const initialBody = await page.evaluate(() => document.body.innerText);
    const initialScreenshot = await page.screenshot();
    if (
      initialBody.includes("Bildirim Tipi Secimi") &&
      initialBody.includes("Devam etmek icin lutfen bir bildirim tipi seciniz") &&
      !initialBody.includes("Durum (Kanallardan Bagimsiz)")
    ) {
      report.pass("Ilk acilista bildirim tipi secimi bolumu goruntulendi", "Durum/Kanal alanlari henuz gizli", { screenshot: initialScreenshot });
    } else {
      report.fail("Ilk acilis beklenen icerigi gostermedi", initialBody.slice(0, 300), { screenshot: initialScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Bildirim tipi sec -> Durum + Kanal alanlari gorunur ---
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const afterTipBody = await page.evaluate(() => document.body.innerText);
    const afterTipCombos = await getComboboxValues(page);
    const afterTipScreenshot = await page.screenshot();
    if (
      afterTipBody.includes("Bildirim Tipi ve Genel Durum") &&
      afterTipBody.includes("Durum (Kanallardan Bagimsiz)") &&
      afterTipBody.includes("Bildirim Kanali") &&
      afterTipCombos[1]?.includes("Acik")
    ) {
      report.pass("Bildirim tipi secildikten sonra Durum ve Kanal alanlari goruntulendi", `Tip: ${TIP_ADI}, Durum combobox: ${afterTipCombos[1]}`, { screenshot: afterTipScreenshot });
    } else {
      report.fail("Bildirim tipi secildikten sonra beklenen alanlar goruntulenmedi", `${afterTipBody.slice(0, 300)} | combos=${JSON.stringify(afterTipCombos)}`, { screenshot: afterTipScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 3: Durum'u Kapali yap, kaydet ---
    await selectComboboxByIndex(page, 1, "\uD83D\uDD34 Kapali");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));
    const savedBody = await page.evaluate(() => document.body.innerText);
    const savedScreenshot = await page.screenshot();
    if (savedBody.includes("Genel durum guncellendi")) {
      report.pass("Basari mesaji goruldu", "Genel durum guncellendi.", { screenshot: savedScreenshot });
    } else {
      report.fail("Basari mesaji goruntulenmedi", "Sayfada 'Genel durum guncellendi' metni bulunamadi", { screenshot: savedScreenshot, diagnostics: diagnostics.getLogs() });
    }

    const rowsAfterToggle = await runQuery(DB_QUERY);
    report.sql("Veritabani sorgusu calistirildi", DB_QUERY, rowsAfterToggle);
    if (rowsAfterToggle.length === 1 && rowsAfterToggle[0].is_active === "0") {
      report.pass("Veritabaninda genel durum guncellemesi dogrulandi", "is_active=0 (PARTIALLY_FILLED)");
    } else {
      report.fail("Veritabaninda beklenen is_active degeri bulunamadi", JSON.stringify(rowsAfterToggle), { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 4: Sayfayi yenile, ayni tipi tekrar sec -> kalicilik dogrulamasi ---
    await page.reload({ waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const reloadCombos = await getComboboxValues(page);
    const reloadScreenshot = await page.screenshot();
    if (reloadCombos[1]?.includes("Kapali")) {
      report.pass("Yeniden yuklemeden sonra Durum degisikligi kalici", `Durum combobox: ${reloadCombos[1]}`, { screenshot: reloadScreenshot });
    } else {
      report.fail("Yeniden yuklemeden sonra Durum degisikligi kaybolmus", JSON.stringify(reloadCombos), { screenshot: reloadScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 5: Bildirim Kanali sec -> yer tutucu mesaj ---
    await selectComboboxByIndex(page, 2, "Mobil");
    await new Promise((r) => setTimeout(r, 400));
    const channelBody = await page.evaluate(() => document.body.innerText);
    const channelScreenshot = await page.screenshot();
    if (channelBody.includes("Bu kanal icin sablon ve diger ayarlar yakinda eklenecektir")) {
      report.pass("Kanal secildikten sonra yer tutucu mesaj goruntulendi", "Mobil kanali secildi", { screenshot: channelScreenshot });
    } else {
      report.fail("Kanal secildikten sonra beklenen yer tutucu mesaj goruntulenmedi", channelBody.slice(0, 300), { screenshot: channelScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 6: Baska bir bildirim tipi sec -> kanal secimi sifirlanmali ---
    await selectComboboxByIndex(page, 0, DIGER_TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const resetBody = await page.evaluate(() => document.body.innerText);
    const resetScreenshot = await page.screenshot();
    if (
      resetBody.includes("Sablon ve kanal bazli ayarlari goruntulemek ve duzenlemek icin lutfen bir bildirim kanali seciniz") &&
      !resetBody.includes("Bu kanal icin sablon ve diger ayarlar yakinda eklenecektir")
    ) {
      report.pass("Bildirim tipi degisince kanal secimi sifirlandi", `Yeni tip: ${DIGER_TIP_ADI}`, { screenshot: resetScreenshot });
    } else {
      report.fail("Bildirim tipi degisince kanal secimi sifirlanmadi", resetBody.slice(0, 300), { screenshot: resetScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 7 (Teardown): PARTIALLY_FILLED'i tekrar sec, Durum'u Acik yap ---
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectComboboxByIndex(page, 1, "\uD83D\uDFE2 Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));

    const teardownRows = await runQuery(DB_QUERY);
    if (teardownRows.length === 1 && teardownRows[0].is_active === "1") {
      report.pass("Teardown: genel durum varsayilan (Acik) durumuna geri alindi", "PARTIALLY_FILLED / is_active=1");
    } else {
      report.fail("Teardown basarisiz: genel durum varsayilan duruma donmedi", JSON.stringify(teardownRows));
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
    const crashReport = new ScenarioReport("Bildirim Ayarlari (ZK) - Kapsamli Test (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-guncelleme-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
