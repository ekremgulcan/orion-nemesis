/**
 * Senaryo: Bildirim Ayarlari (React: /crm/bildirim-ayarlari,
 * BildirimAyarlariPage.tsx) ekraninda kapsamli fonksiyonel test - ZK
 * karsiligi (screens/zk/bildirim-ayarlari-guncelleme.cjs) ile ayni
 * senaryo/DB tablosu:
 *   1. Ekran ilk acildiginda "Bildirim Tipi Secimi" basligi ve "devam
 *      etmek icin bildirim tipi seciniz" mesaji gorunur; Durum ve
 *      Bildirim Kanali alanlari henuz gorunmez.
 *   2. Duzenlenebilir bir bildirim tipi (Emrinizin Durumunda Degisiklik
 *      Oldu / PARTIALLY_FILLED) secilir -> baslik "Bildirim Tipi ve Genel
 *      Durum" olur, Durum ve Bildirim Kanali alanlari gorunur.
 *   3. Durum "Kapali" yapilir, "Onaya Gonder" ile kaydedilir -> toast +
 *      veritabaninda is_active=0 dogrulanir.
 *   4. Sayfa yeniden yuklenip ayni tip tekrar secilir -> degisikligin
 *      kalici oldugu dogrulanir (ayri bir onay ekrani yok).
 *   5. Bildirim Kanali secilir (Mobil) -> gercek kanal paneli gorunur:
 *      parametre badge'leri + Mevcut Sablon (salt okunur) icerigi dogru
 *      yansitir, "Duzenle" gorunur, "Iptal"/"Kaydet" gizlidir.
 *   6. "Duzenle" tiklanir -> Musteri Gorur ve Degistirir/Max Deneme
 *      Sayisi/Tekrar Deneme Suresi/Kanal Durumu degistirilir, "Kaydet"
 *      ile kaydedilir -> toast + veritabaninda yeni degerler dogrulanir.
 *   7. "Duzenle" tekrar tiklanir, bir alan degistirilir, "Iptal" ile
 *      vazgecilir -> degisiklik ekranda da veritabaninda da uygulanmamis
 *      olmali.
 *   8. Baska bir bildirim tipi secilince kanal seciminin (ve panelin)
 *      sifirlandigi dogrulanir.
 *   9. Teardown: Durum tekrar "Acik" yapilir; kanal ayarlari orijinal
 *      degerlerine geri alinir.
 *
 * Kullanim: node screens/react/bildirim-ayarlari-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:5173)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  selectDropdownByIndex,
  waitForToast,
  fillNthNonDateInput,
} = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-guncelleme-${Date.now()}.html`);

const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED, zorunlu degil
const DIGER_TIP_ADI = "VIOP Margin Call Bildirimi";
const DB_QUERY = "SELECT is_active FROM notification_types WHERE kod = 'PARTIALLY_FILLED';";
const CHANNEL_DB_QUERY =
  "SELECT nct.max_retry, nct.error_backoff_time, nct.musteri_gorur_ve_degistir, nct.is_active FROM notif_channel_templates nct " +
  "JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id " +
  "WHERE nt.kod = 'PARTIALLY_FILLED' AND nct.kanal = 'PUSH';";
const ORIJINAL_MAX_RETRY = "3";
const ORIJINAL_ERROR_BACKOFF = "180";

async function getNumberInputValues(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="input"][type="number"]')).map((el) => el.value),
  );
}

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari (React) - Kapsamli Test");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac, ilk durumu dogrula ---
    await page.goto(`${BASE_URL}/crm/bildirim-ayarlari`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
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
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const afterTipBody = await page.evaluate(() => document.body.innerText);
    const afterTipScreenshot = await page.screenshot();
    if (
      afterTipBody.includes("Bildirim Tipi ve Genel Durum") &&
      afterTipBody.includes("Durum (Kanallardan Bagimsiz)") &&
      afterTipBody.includes("Bildirim Kanali") &&
      afterTipBody.includes("Acik")
    ) {
      report.pass("Bildirim tipi secildikten sonra Durum ve Kanal alanlari goruntulendi", `Tip: ${TIP_ADI}`, { screenshot: afterTipScreenshot });
    } else {
      report.fail("Bildirim tipi secildikten sonra beklenen alanlar goruntulenmedi", afterTipBody.slice(0, 400), { screenshot: afterTipScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 3: Durum'u Kapali yap, kaydet ---
    await selectDropdownByIndex(page, 1, "Kapali");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    const toastText = await waitForToast(page);
    const savedScreenshot = await page.screenshot();
    if (toastText && toastText.includes("Genel durum guncellendi")) {
      report.pass("Basari toast'i goruldu", toastText, { screenshot: savedScreenshot });
    } else {
      report.fail("Basari toast'i goruntulenmedi", `Alinan: ${toastText}`, { screenshot: savedScreenshot, diagnostics: diagnostics.getLogs() });
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
    await new Promise((r) => setTimeout(r, 800));
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const reloadBody = await page.evaluate(() => document.body.innerText);
    const reloadScreenshot = await page.screenshot();
    if (reloadBody.includes("Kapali")) {
      report.pass("Yeniden yuklemeden sonra Durum degisikligi kalici", "Durum: Kapali", { screenshot: reloadScreenshot });
    } else {
      report.fail("Yeniden yuklemeden sonra Durum degisikligi kaybolmus", reloadBody.slice(0, 300), { screenshot: reloadScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 5: Bildirim Kanali sec (Mobil) -> gercek kanal paneli gorunur ---
    await selectDropdownByIndex(page, 2, "Mobil");
    await new Promise((r) => setTimeout(r, 500));
    const channelBody = await page.evaluate(() => document.body.innerText);
    const channelTextarea = await page.evaluate(() => document.querySelector("textarea")?.value ?? "");
    const channelScreenshot = await page.screenshot();
    if (
      channelBody.includes("Sablonda Kullanilabilecek Parametreler") &&
      channelBody.includes("${Symbol}") &&
      channelBody.includes("Mevcut Sablon (Salt Okunur)") &&
      channelTextarea.includes("${OrderId}") &&
      channelBody.includes("Duzenle") &&
      !channelBody.includes("Iptal")
    ) {
      report.pass("Kanal secildikten sonra gercek panel (parametreler + sablon) goruntulendi", "Duzenle gorunur, Iptal/Kaydet gizli", { screenshot: channelScreenshot });
    } else {
      report.fail("Kanal secildikten sonra beklenen panel goruntulenmedi", channelBody.slice(0, 400), { screenshot: channelScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 6: Duzenle -> Diger Ayarlar'i degistir, Kaydet ---
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const editBody = await page.evaluate(() => document.body.innerText);
    if (editBody.includes("Iptal") && editBody.includes("Kaydet") && !editBody.includes("Salt Okunur")) {
      report.pass("Duzenle sonrasi Iptal/Kaydet goruntulendi, '(Salt Okunur)' ibaresi kayboldu", "Duzenleme modu aktif");
    } else {
      report.fail("Duzenle sonrasi beklenen degisiklikler olmadi", editBody.slice(0, 400), { diagnostics: diagnostics.getLogs() });
    }

    await selectDropdownByIndex(page, 3, "Hayir"); // Musteri Gorur ve Degistirir
    await fillNthNonDateInput(page, 0, "5", { root: null }); // Max Deneme Sayisi
    await fillNthNonDateInput(page, 1, "300", { root: null }); // Tekrar Deneme Suresi
    await new Promise((r) => setTimeout(r, 300)); // input re-render'inin oturmasini bekle
    await selectDropdownByIndex(page, 4, "Kapali"); // Kanal Durumu
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    const kaydetToast = await waitForToast(page);
    const kaydetScreenshot = await page.screenshot();
    if (kaydetToast && kaydetToast.includes("Kanal ayarlari kaydedildi")) {
      report.pass("Kanal ayarlari icin basari toast'i goruldu", kaydetToast, { screenshot: kaydetScreenshot });
    } else {
      report.fail("Kanal ayarlari basari toast'i goruntulenmedi", `Alinan: ${kaydetToast}`, { screenshot: kaydetScreenshot, diagnostics: diagnostics.getLogs() });
    }

    const channelRows = await runQuery(CHANNEL_DB_QUERY);
    report.sql("Veritabani sorgusu calistirildi", CHANNEL_DB_QUERY, channelRows);
    if (
      channelRows.length === 1 &&
      channelRows[0].max_retry === "5" &&
      channelRows[0].error_backoff_time === "300" &&
      channelRows[0].musteri_gorur_ve_degistir === "0" &&
      channelRows[0].is_active === "0"
    ) {
      report.pass("Veritabaninda kanal ayarlari guncellemesi dogrulandi", JSON.stringify(channelRows[0]));
    } else {
      report.fail("Veritabaninda beklenen kanal ayarlari bulunamadi", JSON.stringify(channelRows), { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 7: Duzenle -> bir alani degistir -> Iptal ile vazgec ---
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await fillNthNonDateInput(page, 0, "1", { root: null }); // Max Deneme Sayisi - kaydedilmeyecek
    await clickButtonByText(page, "Iptal");
    await new Promise((r) => setTimeout(r, 500));
    const afterIptalInputs = await getNumberInputValues(page);
    const iptalRows = await runQuery(CHANNEL_DB_QUERY);
    if (afterIptalInputs[0] === "5" && iptalRows[0]?.max_retry === "5") {
      report.pass("Iptal, kaydedilmemis degisikligi atti", "Max Deneme Sayisi hala 5 (ekranda ve DB'de)");
    } else {
      report.fail("Iptal beklenen sekilde vazgecmedi", `ekran=${afterIptalInputs[0]}, db=${iptalRows[0]?.max_retry}`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 8: Baska bir bildirim tipi sec -> kanal secimi sifirlanmali ---
    await selectDropdownByIndex(page, 0, DIGER_TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const resetBody = await page.evaluate(() => document.body.innerText);
    const resetScreenshot = await page.screenshot();
    if (
      resetBody.includes("Sablon ve kanal bazli ayarlari goruntulemek ve duzenlemek icin lutfen bir bildirim kanali seciniz") &&
      !resetBody.includes("Sablonda Kullanilabilecek Parametreler")
    ) {
      report.pass("Bildirim tipi degisince kanal secimi sifirlandi", `Yeni tip: ${DIGER_TIP_ADI}`, { screenshot: resetScreenshot });
    } else {
      report.fail("Bildirim tipi degisince kanal secimi sifirlanmadi", resetBody.slice(0, 300), { screenshot: resetScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 9 (Teardown): PARTIALLY_FILLED'i tekrar sec, Durum'u Acik yap,
    //     kanal ayarlarini orijinal degerlerine geri al ---
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectDropdownByIndex(page, 1, "Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await waitForToast(page);

    const teardownRows = await runQuery(DB_QUERY);
    if (teardownRows.length === 1 && teardownRows[0].is_active === "1") {
      report.pass("Teardown: genel durum varsayilan (Acik) durumuna geri alindi", "PARTIALLY_FILLED / is_active=1");
    } else {
      report.fail("Teardown basarisiz: genel durum varsayilan duruma donmedi", JSON.stringify(teardownRows));
    }

    await selectDropdownByIndex(page, 2, "Mobil");
    await new Promise((r) => setTimeout(r, 700));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await selectDropdownByIndex(page, 3, "Evet");
    await fillNthNonDateInput(page, 0, ORIJINAL_MAX_RETRY, { root: null });
    await fillNthNonDateInput(page, 1, ORIJINAL_ERROR_BACKOFF, { root: null });
    await new Promise((r) => setTimeout(r, 300)); // input re-render'inin oturmasini bekle
    await selectDropdownByIndex(page, 4, "Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    await waitForToast(page);

    const channelTeardownRows = await runQuery(CHANNEL_DB_QUERY);
    if (
      channelTeardownRows.length === 1 &&
      channelTeardownRows[0].max_retry === ORIJINAL_MAX_RETRY &&
      channelTeardownRows[0].error_backoff_time === ORIJINAL_ERROR_BACKOFF &&
      channelTeardownRows[0].musteri_gorur_ve_degistir === "1" &&
      channelTeardownRows[0].is_active === "1"
    ) {
      report.pass("Teardown: kanal ayarlari varsayilan degerlerine geri alindi", JSON.stringify(channelTeardownRows[0]));
    } else {
      report.fail("Teardown basarisiz: kanal ayarlari varsayilan degerlere donmedi", JSON.stringify(channelTeardownRows));
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
    const crashReport = new ScenarioReport("Bildirim Ayarlari (React) - Kapsamli Test (CRASH)");
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
