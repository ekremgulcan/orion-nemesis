/**
 * Senaryo: Bildirim Ayarlari (ZK: notification/bildirim-ayarlari.zul)
 * ekraninda kapsamli fonksiyonel test:
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
 *   5. Bildirim Kanali secilir (Push) -> gercek kanal paneli gorunur:
 *      parametre badge'leri + Mevcut Sablon (salt okunur) icerigi dogru
 *      yansitir, "Duzenle" gorunur, "Iptal"/"Kaydet" gizlidir.
 *   6. "Duzenle" tiklanir -> "Iptal"/"Kaydet" gorunur, Musteri Gorur ve
 *      Degistirir/Max Deneme Sayisi/Tekrar Deneme Suresi/Kanal Durumu
 *      degistirilir, "Kaydet" ile kaydedilir -> basari mesaji +
 *      veritabaninda yeni degerler dogrulanir.
 *   7. "Duzenle" tekrar tiklanir, bir alan degistirilir, "Iptal" ile
 *      vazgecilir -> degisiklik ekranda da veritabaninda da uygulanmamis
 *      olmali (bir onceki adimda kaydedilen deger degismeden kalir).
 *   8. Baska bir bildirim tipi secilince kanal seciminin (ve kanal
 *      panelinin) sifirlandigi dogrulanir.
 *   9. Teardown: Durum tekrar "Acik" yapilir; kanal ayarlari (Max Deneme
 *      Sayisi/Tekrar Deneme Suresi/Musteri Gorur ve Degistirir/Kanal
 *      Durumu) orijinal degerlerine geri alinir - kalici referans veri
 *      baska senaryolari etkilemesin diye.
 *
 * Kullanim: node screens/zk/bildirim-ayarlari-guncelleme.cjs
 * Ortam degiskenleri (opsiyonel): BASE_URL (varsayilan http://localhost:8080)
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  selectComboboxByIndex,
  getComboboxValues,
  setIntboxByIndex,
  getIntboxValues,
} = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-guncelleme-${Date.now()}.html`);

const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED, zorunlu degil
const DIGER_TIP_ADI = "VIOP Margin Call Bildirimi"; // sadece kanal-sifirlama testi icin secilir, durumu degistirilmez
const DB_QUERY = "SELECT is_active FROM notification_types WHERE kod = 'PARTIALLY_FILLED';";
const CHANNEL_DB_QUERY =
  "SELECT nct.max_retry, nct.error_backoff_time, nct.musteri_gorur_ve_degistir, nct.is_active FROM notif_channel_templates nct " +
  "JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id " +
  "WHERE nt.kod = 'PARTIALLY_FILLED' AND nct.kanal = 'PUSH';";
// Orijinal (V38 seed) degerler - teardown'da buraya geri donulur.
const ORIJINAL_MAX_RETRY = "3";
const ORIJINAL_ERROR_BACKOFF = "180";

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

    // --- Adim 5: Bildirim Kanali sec (Push) -> gercek kanal paneli gorunur ---
    await selectComboboxByIndex(page, 2, "Push");
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
    if (editBody.includes("Iptal") && editBody.includes("Kaydet") && !editBody.includes("Mevcut Sablon (Salt Okunur)")) {
      report.pass("Duzenle sonrasi Iptal/Kaydet goruntulendi, '(Salt Okunur)' ibaresi kayboldu", "Duzenleme modu aktif");
    } else {
      report.fail("Duzenle sonrasi beklenen degisiklikler olmadi", editBody.slice(0, 400), { diagnostics: diagnostics.getLogs() });
    }

    await selectComboboxByIndex(page, 3, "Hayir"); // Musteri Gorur ve Degistirir
    await setIntboxByIndex(page, 0, "5"); // Max Deneme Sayisi
    // Ard arda iki intbox bind istegi, birbirinin AU round-trip'ini
    // "gecebilir" (stale bir yanit daha yeni degeri ezebilir) - her
    // bind'in oturmasini bekleyerek bu yarisi ortadan kaldirilir.
    await new Promise((r) => setTimeout(r, 350));
    await setIntboxByIndex(page, 1, "300"); // Tekrar Deneme Suresi
    await new Promise((r) => setTimeout(r, 350));
    await selectComboboxByIndex(page, 4, "\uD83D\uDD34 Kapali"); // Kanal Durumu
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1000));
    const kaydetBody = await page.evaluate(() => document.body.innerText);
    const kaydetScreenshot = await page.screenshot();
    if (kaydetBody.includes("Kanal ayarlari kaydedildi")) {
      report.pass("Kanal ayarlari icin basari mesaji goruldu", "Kanal ayarlari kaydedildi.", { screenshot: kaydetScreenshot });
    } else {
      report.fail("Kanal ayarlari basari mesaji goruntulenmedi", kaydetBody.slice(0, 300), { screenshot: kaydetScreenshot, diagnostics: diagnostics.getLogs() });
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
    await setIntboxByIndex(page, 0, "1"); // Max Deneme Sayisi - kaydedilmeyecek
    await new Promise((r) => setTimeout(r, 350)); // bind'in AU round-trip'inin oturmasini bekle
    await clickButtonByText(page, "Iptal");
    await new Promise((r) => setTimeout(r, 500));
    const afterIptalIntboxes = await getIntboxValues(page);
    const iptalRows = await runQuery(CHANNEL_DB_QUERY);
    if (afterIptalIntboxes[0] === "5" && iptalRows[0]?.max_retry === "5") {
      report.pass("Iptal, kaydedilmemis degisikligi atti", `Max Deneme Sayisi hala 5 (ekranda ve DB'de)`);
    } else {
      report.fail("Iptal beklenen sekilde vazgecmedi", `ekran=${afterIptalIntboxes[0]}, db=${iptalRows[0]?.max_retry}`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 8: Baska bir bildirim tipi sec -> kanal secimi sifirlanmali ---
    await selectComboboxByIndex(page, 0, DIGER_TIP_ADI);
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

    await selectComboboxByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await selectComboboxByIndex(page, 3, "Evet");
    await new Promise((r) => setTimeout(r, 350));
    await setIntboxByIndex(page, 0, ORIJINAL_MAX_RETRY);
    await new Promise((r) => setTimeout(r, 350));
    await setIntboxByIndex(page, 1, ORIJINAL_ERROR_BACKOFF);
    await new Promise((r) => setTimeout(r, 350));
    await selectComboboxByIndex(page, 4, "\uD83D\uDFE2 Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1000));

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
