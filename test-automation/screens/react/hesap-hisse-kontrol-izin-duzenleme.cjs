/**
 * Senaryo: Hesap/Hisse Bazinda Kontrol (React: /risk/hesap-hisse-kontrol)
 * sayfasinda, hesap no 10003 olan kullanicinin (bkaya / THYAO) mevcut
 * izin kaydi duzenlenir - "Acik Satis Izni" kapatilir (Var -> Yok);
 * ardindan (1) basari toast'inin goruntulendigi, (2) veritabaninda
 * account_instrument_controls tablosunda acik_satis_izni = 0 oldugu,
 * (3) ayni sayfadaki tabloda degisikligin yansidigi dogrulanir.
 *
 * Bu kayit CREATE edilen bir test verisi degil, projenin kalici seed
 * verisidir (control_id sabit degil, hesap_no='10003' ile aranir) - bu
 * yuzden script sonunda kayit SILINMEZ, orijinal degerine (Acik Satis
 * Izni tekrar acik) GERI DONDURULUR, boylece seed veri bozulmadan
 * kalir ve senaryo tekrar tekrar calistirilabilir.
 *
 * Kullanim: node screens/react/hesap-hisse-kontrol-izin-duzenleme.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  fillInputsInOrder,
  setCheckboxByIndex,
  getCheckboxStates,
  waitForToast,
  findTableRow,
} = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `hesap-hisse-kontrol-izin-duzenleme-${Date.now()}.html`);

const HESAP_NO = "10003";

async function run() {
  const report = new ScenarioReport("Hesap/Hisse Bazinda Kontrol (React) - Hesap 10003 Izin Duzenleme");
  let browser;
  let originalState = null; // { alisIzni, satisIzni, acikSatisIzni } - to restore in teardown

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac, hesap 10003'u ara ---
    await page.goto(`${BASE_URL}/risk/hesap-hisse-kontrol`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const openScreenshot = await page.screenshot();
    report.pass("Hesap/Hisse Bazinda Kontrol sayfasi acildi", `${BASE_URL}/risk/hesap-hisse-kontrol`, { screenshot: openScreenshot });

    // Arama kutusu dialog disinda, tek Input oldugu icin root:null ile
    // tum sayfada aranir (henuz dialog acilmadi).
    await fillInputsInOrder(page, [HESAP_NO], { root: null });
    await new Promise((r) => setTimeout(r, 600));

    const rowBeforeEdit = await findTableRow(page, [HESAP_NO]);
    const searchScreenshot = await page.screenshot();
    if (rowBeforeEdit) {
      report.pass("Hesap 10003 kaydi listede bulundu", rowBeforeEdit.join(" | "), { screenshot: searchScreenshot });
    } else {
      report.fail("Hesap 10003 kaydi listede bulunamadi", "Arama sonrasi tabloda eslesen satir yok", { screenshot: searchScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 2: Duzenle dialogunu ac, mevcut izinleri kaydet ---
    // Arama "10003" ile filtrelendigi icin tabloda tek satir kalir, bu
    // yuzden clickButtonByText("Duzenle") sayfada tek eslesmeyi bulur -
    // birden fazla satir olsaydi bu belirsiz olurdu.
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const dialogScreenshot = await page.screenshot();
    report.pass("Kontrolu Duzenle dialogu acildi", null, { screenshot: dialogScreenshot });

    const [alisIzni, satisIzni, acikSatisIzni] = await getCheckboxStates(page);
    originalState = { alisIzni, satisIzni, acikSatisIzni };
    report.info(
      "Mevcut izin durumu okundu",
      `Alis: ${alisIzni ? "Var" : "Yok"}, Satis: ${satisIzni ? "Var" : "Yok"}, Acik Satis: ${acikSatisIzni ? "Var" : "Yok"}`
    );

    // --- Adim 3: Acik Satis Izni'ni kapat, kaydet ---
    // Checkbox DOM sirasi: [0] Alis Izni, [1] Satis Izni, [2] Acik Satis Izni.
    await setCheckboxByIndex(page, 2, false);
    const toggledScreenshot = await page.screenshot();
    report.pass("Acik Satis Izni kapatildi (Var -> Yok)", null, { screenshot: toggledScreenshot });

    await clickButtonByText(page, "Kaydet");
    const toastText = await waitForToast(page);
    const toastScreenshot = await page.screenshot();
    if (toastText && toastText.includes("kaydedildi")) {
      report.pass("Basari toast'i goruldu", toastText, { screenshot: toastScreenshot });
    } else {
      report.fail("Basari toast'i goruntenmedi", toastText ?? "(toast bulunamadi)", { screenshot: toastScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 4: Veritabaninda dogrula ---
    const dbQuery =
      "SELECT c.control_id, u.kullanici_adi, a.hesap_no, i.sembol, c.alis_izni, c.satis_izni, c.acik_satis_izni " +
      "FROM account_instrument_controls c " +
      "JOIN users u ON u.user_id = c.user_id " +
      "JOIN accounts a ON a.account_id = c.account_id " +
      "JOIN instruments i ON i.instrument_id = c.instrument_id " +
      `WHERE a.hesap_no = '${HESAP_NO}';`;
    const rows = await runQuery(dbQuery);
    report.sql("Veritabani sorgusu calistirildi", dbQuery, rows);
    if (rows.length === 1 && rows[0].acik_satis_izni === "0") {
      report.pass(
        "Veritabaninda acik_satis_izni guncellendi",
        `control_id=${rows[0].control_id}, alis_izni=${rows[0].alis_izni}, satis_izni=${rows[0].satis_izni}, acik_satis_izni=${rows[0].acik_satis_izni}`
      );
    } else {
      report.fail("Veritabaninda acik_satis_izni beklenen degere (0) guncellenmedi", JSON.stringify(rows), { diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 5: Ayni sayfadaki tabloda dogrula ---
    await new Promise((r) => setTimeout(r, 500));
    const rowAfterEdit = await findTableRow(page, [HESAP_NO]);
    const afterEditScreenshot = await page.screenshot();
    if (rowAfterEdit) {
      report.pass("Guncellenmis kayit tabloda goruldu", rowAfterEdit.join(" | "), { screenshot: afterEditScreenshot });
    } else {
      report.fail("Guncellenmis kayit tabloda bulunamadi", `Aranan: hesapNo=${HESAP_NO}`, { screenshot: afterEditScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Teardown: izinleri orijinal durumuna geri dondur ---
    // Bu bir CREATE degil UPDATE senaryosu oldugu icin (kalici seed
    // kaydi duzenleniyor), teardown silme degil "geri alma" seklinde
    // yapilir - Acik Satis Izni tekrar aciliyor.
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await setCheckboxByIndex(page, 2, originalState.acikSatisIzni);
    await clickButtonByText(page, "Kaydet");
    await waitForToast(page);
    report.info("Teardown: Acik Satis Izni orijinal durumuna geri dondu", originalState.acikSatisIzni ? "Var" : "Yok");
  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  // Guvenlik agi: eger UI uzerinden geri alma basarisiz olduysa
  // (ör. bir onceki adim FAIL oldu ve script erken bitti), veritabanini
  // dogrudan orijinal degere geri getir - seed veri asla bozuk
  // birakilmamali.
  if (originalState) {
    const verifyRows = await runQuery(
      `SELECT c.acik_satis_izni FROM account_instrument_controls c JOIN accounts a ON a.account_id = c.account_id WHERE a.hesap_no = '${HESAP_NO}';`
    );
    const currentValue = verifyRows[0]?.acik_satis_izni;
    const expectedValue = originalState.acikSatisIzni ? "1" : "0";
    if (currentValue !== expectedValue) {
      console.log(`\nGuvenlik agi: acik_satis_izni beklenen (${expectedValue}) degil (${currentValue}), dogrudan DB'den duzeltiliyor...`);
      await runQuery(
        `UPDATE account_instrument_controls SET acik_satis_izni = ${expectedValue} FROM account_instrument_controls c JOIN accounts a ON a.account_id = c.account_id WHERE a.hesap_no = '${HESAP_NO}';`
      );
      console.log("DB duzeltmesi tamamlandi.");
    } else {
      console.log("\nSeed veri dogrulandi: acik_satis_izni orijinal durumunda.");
    }
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Hesap/Hisse Bazinda Kontrol (React) - Hesap 10003 Izin Duzenleme (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `hesap-hisse-kontrol-izin-duzenleme-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  // Guvenlik agi: crash oncesi orijinal durum okunabilmisse (yani
  // dialog acilip checkbox'lar okunmustu), seed veriyi DB'den
  // dogrudan geri getir - UI uzerinden geri alma firsati kalmadi.
  console.error(
    "\nUYARI: Script beklenmeyen sekilde sonlandigi icin hesap 10003 " +
      "kaydinin 'Acik Satis Izni' degeri UI uzerinden geri alinamadi. " +
      "Su sorguyla mevcut durumu kontrol edip gerekirse manuel duzelt:\n" +
      "SELECT c.acik_satis_izni FROM account_instrument_controls c " +
      "JOIN accounts a ON a.account_id = c.account_id WHERE a.hesap_no = '10003';"
  );
  process.exit(1);
});
