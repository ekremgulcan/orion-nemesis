/**
 * Senaryo: Bildirim Ayarlari (ZK) - "Sablonda Kullanilabilecek
 * Parametreler" listesinin SABIT oldugunu ve sablona yeni bir
 * parametre eklemenin (ne gorsel olarak listeye eklenmesinin ne de
 * kaydedilmesinin) mumkun OLMADIGINI dogrular. Kullanicinin bildirdigi
 * gercek bug: sablona yeni bir ${Parametre} yazildiginda bu parametre
 * hemen listeye ekleniyordu (liste, templateBody'den anlik turetiliyordu).
 * Fix: liste artik NotifChannelTemplate.allowedParametreler (V39
 * migration, sabit/referans veri) kolonundan geliyor; kaydetme
 * sirasinda izin listesinin disinda bir parametre kullanan sablon
 * reddediliyor (bkz. BildirimAyarlariService#dogrulaSablonParametreleri).
 *
 *   1. PARTIALLY_FILLED / Push secilir -> parametre listesi Symbol,
 *      OrderId, Side olarak gorunur (DB'deki allowed_parametreler ile
 *      birebir).
 *   2. Duzenle -> sablona yeni bir "${SahteParam}" tokeni eklenir ->
 *      parametre listesi DEGISMEZ (hala sadece Symbol/OrderId/Side).
 *   3. Kaydet -> hata Messagebox'i gosterilir ("tanimli olmayan
 *      parametre"), duzenleme modu aktif kalir, veritabaninda
 *      templateBody DEGISMEMIS olur.
 *   4. Iptal ile temiz cikilir, ekran ve DB orijinal haliyle dogrulanir.
 *
 * Kullanim: node screens/zk/bildirim-ayarlari-sabit-parametreler.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  selectComboboxByIndex,
  waitForMessagebox,
  clickMessageboxButton,
} = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-sabit-parametreler-${Date.now()}.html`);

const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED
const TEMPLATE_DB_QUERY =
  "SELECT nct.template_body, nct.allowed_parametreler FROM notif_channel_templates nct " +
  "JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id " +
  "WHERE nt.kod = 'PARTIALLY_FILLED' AND nct.kanal = 'PUSH';";

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari (ZK) - Sabit Sablon Parametreleri");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    const originalRows = await runQuery(TEMPLATE_DB_QUERY);
    report.sql("Baslangic durumu", TEMPLATE_DB_QUERY, originalRows);
    const originalTemplateBody = originalRows[0]?.template_body;
    const allowedParametreler = (originalRows[0]?.allowed_parametreler ?? "").split(",").map((s) => s.trim());

    await page.goto(`${BASE_URL}/notification/bildirim-ayarlari.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));

    // --- Adim 1: Tip + kanal sec, parametre listesini dogrula ---
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectComboboxByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    const initialBody = await page.evaluate(() => document.body.innerText);
    const initialScreenshot = await page.screenshot();
    const allExpectedParamsShown = allowedParametreler.every((p) => initialBody.includes(`\${${p}}`));
    if (allExpectedParamsShown) {
      report.pass("Adim 1: Parametre listesi DB'deki sabit allowed_parametreler ile eslesiyor", JSON.stringify(allowedParametreler), { screenshot: initialScreenshot });
    } else {
      report.fail("Adim 1: Parametre listesi beklenen sabit listeyle eslesmiyor", `Beklenen: ${JSON.stringify(allowedParametreler)}`, {
        screenshot: initialScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 2: Duzenle -> sablona yeni bir sahte parametre ekle ---
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const textarea = await page.$("textarea");
    await textarea.click();
    await page.keyboard.press("End");
    await textarea.type(" ${SahteParam}");
    await new Promise((r) => setTimeout(r, 400));
    const afterTypingScreenshot = await page.screenshot();
    // "Sablonda Kullanilabilecek Parametreler" basligi/textarea'nin kendi
    // icerigi (SahteParam) zaten body innerText'te olacaktir - asil kontrol
    // SahteParam'in badge LISTESINE eklenip eklenmedigi, bu yuzden
    // innerText yerine dogrudan badge <span>'lerini okuyoruz.
    const badgeTextsAfterTyping = await page.evaluate(() =>
      Array.from(document.querySelectorAll("span")).map((s) => s.textContent.trim()).filter((t) => /^\$\{\w+\}$/.test(t))
    );
    if (!badgeTextsAfterTyping.includes("${SahteParam}") && allowedParametreler.every((p) => badgeTextsAfterTyping.includes(`\${${p}}`))) {
      report.pass(
        "Adim 2: Sablona yeni parametre yazilmasi listeyi DEGISTIRMEDI",
        `Badge listesi hala sabit: ${JSON.stringify(badgeTextsAfterTyping)}`,
        { screenshot: afterTypingScreenshot }
      );
    } else {
      report.fail(
        "Adim 2: Sablona yeni parametre yazilinca listeye eklendi - GERCEK BUG (fix calismadi)",
        `Badge listesi: ${JSON.stringify(badgeTextsAfterTyping)}`,
        { screenshot: afterTypingScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 3: Kaydet -> reddedilmeli ---
    await clickButtonByText(page, "Kaydet");
    const errorMessage = await waitForMessagebox(page, 3000);
    const errorScreenshot = await page.screenshot();
    if (errorMessage && errorMessage.includes("tanimli olmayan") && errorMessage.includes("SahteParam")) {
      report.pass("Adim 3: Gecersiz parametre kaydetme sirasinda reddedildi", errorMessage, { screenshot: errorScreenshot });
      await clickMessageboxButton(page, "OK");
      await new Promise((r) => setTimeout(r, 300));
    } else {
      report.fail("Adim 3: Gecersiz parametre reddedilmedi (hata mesaji gorunmedi)", `Alinan: ${errorMessage}`, {
        screenshot: errorScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // document.body.innerText textarea'nin .value'sunu ICERMEZ (input'larla
    // ayni bilinen kisitlama, bkz. zk.js#getComboboxValues yorumu) - textarea
    // icerigini dogrudan .value uzerinden okumak gerekir.
    const stillEditingBody = await page.evaluate(() => document.body.innerText);
    const stillEditingTextareaValue = await page.evaluate(() => document.querySelector("textarea")?.value ?? "");
    if (stillEditingBody.includes("Iptal") && stillEditingTextareaValue.includes("SahteParam")) {
      report.pass("Adim 3: Reddedilen kayittan sonra duzenleme modu aktif kaldi (kullanici duzeltebilir)", "");
    } else {
      report.fail("Adim 3: Reddedilen kayittan sonra duzenleme modundan cikildi", `body=${stillEditingBody.slice(0, 200)}, textarea=${stillEditingTextareaValue}`, {
        diagnostics: diagnostics.getLogs(),
      });
    }

    const dbAfterRejectedSave = await runQuery(TEMPLATE_DB_QUERY);
    report.sql("Adim 3: veritabani sorgusu (reddedilen kayittan sonra)", TEMPLATE_DB_QUERY, dbAfterRejectedSave);
    if (dbAfterRejectedSave[0]?.template_body === originalTemplateBody) {
      report.pass("Adim 3: Veritabaninda templateBody DEGISMEDI (reddedilen kayit persist olmadi)", "");
    } else {
      report.fail("Adim 3: Veritabaninda templateBody degismis - reddedilen kayit yanlislikla kaydedilmis", JSON.stringify(dbAfterRejectedSave[0]), {
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 4 (Teardown): Iptal ile temiz cik ---
    await clickButtonByText(page, "Iptal");
    await new Promise((r) => setTimeout(r, 500));
    const afterIptalBody = await page.evaluate(() => document.body.innerText);
    if (!afterIptalBody.includes("SahteParam") && afterIptalBody.includes("Duzenle")) {
      report.pass("Adim 4 (Teardown): Iptal ile temiz cikildi, ekran orijinal sablona dondu", "");
    } else {
      report.fail("Adim 4 (Teardown): Iptal sonrasi ekran beklenen sekilde temizlenmedi", afterIptalBody.slice(0, 300), { diagnostics: diagnostics.getLogs() });
    }

    const finalDbRows = await runQuery(TEMPLATE_DB_QUERY);
    if (finalDbRows[0]?.template_body === originalTemplateBody) {
      report.pass("Teardown: Veritabaninda hicbir kalinti degisiklik yok", "");
    } else {
      report.fail("Teardown basarisiz: veritabaninda beklenmeyen degisiklik var", JSON.stringify(finalDbRows[0]));
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
    const crashReport = new ScenarioReport("Bildirim Ayarlari (ZK) - Sabit Sablon Parametreleri (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-sabit-parametreler-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
