/**
 * Senaryo: Hisse Risk Parametreleri (React: /risk/hisse-risk-parametreleri)
 * sayfasinda tam kayit yasam dongusu - "+ Yeni Ekle" ile hesap no 10002
 * (Fatma Sahin / M000002, script baslangicinda hisse_risk_parametreleri
 * tablosunda HIC kaydi olmayan bir hesap) icin yeni bir risk profili
 * olusturulur, ardindan ayni kayit duzenlenir (kimlik alanlarinin kilitli
 * oldugu dogrulanir, Net Varlik Limit Carpani ve bir grup izni
 * degistirilir), son olarak "Sil" + AlertDialog onayiyla silinir.
 *
 * Bu bir CREATE senaryosu oldugu icin (kalici seed verisi degil), teardown
 * ayrica gerekmez - senaryonun kendi "Sil" adimi zaten temizligi yapar;
 * script sonunda yine de bir guvenlik agi olarak DB'de hesapNo=10002 icin
 * kalinti olup olmadigi kontrol edilir.
 *
 * Kullanim: node screens/react/hisse-risk-parametreleri-kayit-yasam-dongusu.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  clickButtonByTextWithin,
  fillInputsInOrder,
  selectDropdownByIndex,
  getSelectDisabledStates,
  setSwitchByIndex,
  getSwitchStates,
  findTableRow,
  waitForToast,
} = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SCENARIO_NAME = "Hisse Risk Parametreleri (React) - Kayit Olusturma / Duzenleme / Silme";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `hisse-risk-parametreleri-kayit-yasam-dongusu-${Date.now()}.html`);

const HESAP_NO = "10002";
const MUSTERI_NO_BEKLENEN = "M000002";
const MUSTERI_ADI_BEKLENEN = "Fatma Sahin";

// aside.bg-surface (DetailAside) icindeki [data-slot="input"] sirasi.
const ASIDE_INPUT = { HESAP_NO: 0, MUSTERI_NO: 1, MUSTERI_ADI: 2, ACIK_TAKAS: 3, ACIGA_SATIS: 4 };
// Sayfa genelinde [data-slot="select-trigger"] sirasi - index 0 arama
// filtresinin "Kullanici Tipi" select'i, form select'leri 1'den baslar.
const SELECT = { KULLANICI_TIPI: 1, HESAP_TIPI: 2, ALIS: 3, SATIS: 4, ACIK_SATIS: 5, CARPAN: 6 };
// [role="switch"] sirasi (DetailAside icinde, sayfada baska switch yok).
const SWITCH = { KREDISIZ_A_ALIS: 0, GRUP_B_ALIS: 1, KREDISIZ_PAYLAR_KONTROLSUZ: 8 };

const HISSE_RISK_QUERY =
  "SELECT h.hisse_risk_parametre_id, h.kullanici_tipi, h.alis_kontrol_tipi, h.satis_kontrol_tipi, " +
  "h.acik_satis_kontrol_tipi, h.acik_takas_limiti, h.aciga_satis_limiti, h.net_varlik_limit_carpani, " +
  "h.kredisiz_grup_a_alis_yapabilir, h.grup_b_alis_yapabilir, h.kredisiz_paylarda_kontrolsuz_satis " +
  "FROM hisse_risk_parametreleri h JOIN accounts a ON a.account_id = h.account_id " +
  `WHERE a.hesap_no = '${HESAP_NO}';`;

async function run() {
  const report = new ScenarioReport(SCENARIO_NAME);
  let browser;
  let createdId = null;

  try {
    // --- On kosul: hesapNo=10002'de kalinti test verisi yok mu? ---
    const preExisting = await runQuery(HISSE_RISK_QUERY);
    if (preExisting.length > 0) {
      report.info(
        "On temizlik: hesapNo=10002 icin onceden kalinti kayit bulundu, siliniyor",
        JSON.stringify(preExisting)
      );
      for (const row of preExisting) {
        await runQuery(`DELETE FROM hisse_risk_parametreleri WHERE hisse_risk_parametre_id = ${row.hisse_risk_parametre_id};`);
      }
    } else {
      report.info("On kosul dogrulandi", "hesapNo=10002 icin hic hisse_risk_parametreleri kaydi yok");
    }

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekrani ac ---
    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const openScreenshot = await page.screenshot();
    report.pass("Hisse Risk Parametreleri sayfasi acildi", `${BASE_URL}/risk/hisse-risk-parametreleri`, { screenshot: openScreenshot });

    // --- Adim 2: Yeni Ekle formunu ac ---
    await clickButtonByText(page, "+ Yeni Ekle");
    await new Promise((r) => setTimeout(r, 400));
    const formOpenScreenshot = await page.screenshot();
    report.pass("Yeni Ekle formu acildi (sag panel)", null, { screenshot: formOpenScreenshot });

    // --- Adim 3: Hesap No + limitleri gir, Bul ile hesabi bul ---
    await fillInputsInOrder(page, ["10002", null, null, "12000", "9000"], { root: "aside.bg-surface" });
    report.pass("Hesap No (10002) ve limitler girildi", "Acik Takas Limiti=12000, Aciga Satis Limiti=9000");

    await clickButtonByText(page, "Bul");
    await new Promise((r) => setTimeout(r, 700));
    const bulResult = await page.evaluate((idx) => {
      const aside = document.querySelector("aside.bg-surface");
      const inputs = Array.from(aside.querySelectorAll('[data-slot="input"]'));
      return { musteriNo: inputs[idx.MUSTERI_NO]?.value, musteriAdi: inputs[idx.MUSTERI_ADI]?.value };
    }, ASIDE_INPUT);
    const bulScreenshot = await page.screenshot();
    if (bulResult.musteriNo === MUSTERI_NO_BEKLENEN && bulResult.musteriAdi === MUSTERI_ADI_BEKLENEN) {
      report.pass("Bul butonu hesabi buldu", `${bulResult.musteriNo} / ${bulResult.musteriAdi}`, { screenshot: bulScreenshot });
    } else {
      report.fail(
        "Bul butonu beklenen hesap bilgisini getirmedi",
        `Beklenen: ${MUSTERI_NO_BEKLENEN} / ${MUSTERI_ADI_BEKLENEN}, Gelen: ${bulResult.musteriNo} / ${bulResult.musteriAdi}`,
        { screenshot: bulScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 4: Kullanici Tipi / kontrol tipleri / carpan sec, gruplari isaretle ---
    await selectDropdownByIndex(page, SELECT.KULLANICI_TIPI, "Musteri");
    await selectDropdownByIndex(page, SELECT.HESAP_TIPI, "Musteri");
    await selectDropdownByIndex(page, SELECT.ALIS, "Nakit Kontrolu");
    await selectDropdownByIndex(page, SELECT.SATIS, "SPK Kontrollu");
    await selectDropdownByIndex(page, SELECT.ACIK_SATIS, "Kontrolsuz");
    await selectDropdownByIndex(page, SELECT.CARPAN, "3");
    await setSwitchByIndex(page, SWITCH.KREDISIZ_A_ALIS, true);
    await setSwitchByIndex(page, SWITCH.KREDISIZ_PAYLAR_KONTROLSUZ, true);
    const filledScreenshot = await page.screenshot();
    report.pass(
      "Kontrol tipleri, Net Varlik Limit Carpani ve grup izinleri dolduruldu",
      "Alis=Nakit Kontrolu, Satis=SPK Kontrollu, AcikSatis=Kontrolsuz, Carpan=3, KredisizA Alis=acik, Kredisiz Kontrolsuz Satis=acik",
      { screenshot: filledScreenshot }
    );

    // --- Adim 5: Kaydet, basari toast'ini dogrula ---
    await clickButtonByText(page, "Kaydet");
    const saveToast = await waitForToast(page);
    const saveToastScreenshot = await page.screenshot();
    if (saveToast && saveToast.includes("kaydedildi")) {
      report.pass("Basari toast'i goruldu", saveToast, { screenshot: saveToastScreenshot });
    } else {
      report.fail("Basari toast'i goruntenmedi", saveToast ?? "(toast bulunamadi)", {
        screenshot: saveToastScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 6: Veritabaninda yeni kayit olustugunu dogrula ---
    await new Promise((r) => setTimeout(r, 500));
    const createdRows = await runQuery(HISSE_RISK_QUERY);
    report.sql("Veritabani sorgusu calistirildi (create sonrasi)", HISSE_RISK_QUERY, createdRows);
    if (
      createdRows.length === 1 &&
      createdRows[0].kullanici_tipi === "Musteri" &&
      createdRows[0].alis_kontrol_tipi === "Nakit Kontrolu" &&
      createdRows[0].satis_kontrol_tipi === "SPK Kontrollu" &&
      createdRows[0].acik_satis_kontrol_tipi === "Kontrolsuz" &&
      createdRows[0].net_varlik_limit_carpani === "3" &&
      createdRows[0].kredisiz_grup_a_alis_yapabilir === "1" &&
      createdRows[0].kredisiz_paylarda_kontrolsuz_satis === "1"
    ) {
      createdId = createdRows[0].hisse_risk_parametre_id;
      report.pass("Veritabaninda yeni risk profili dogru degerlerle olustu", `hisse_risk_parametre_id=${createdId}`);
    } else {
      report.fail("Veritabanindaki kayit beklenen degerlerle eslesmedi", JSON.stringify(createdRows), {
        diagnostics: diagnostics.getLogs(),
      });
      createdId = createdRows[0]?.hisse_risk_parametre_id ?? null;
    }

    // --- Adim 7: Ana listede kaydin gorundugunu dogrula ---
    const rowAfterCreate = await findTableRow(page, [HESAP_NO, MUSTERI_ADI_BEKLENEN]);
    const listAfterCreateScreenshot = await page.screenshot();
    if (rowAfterCreate) {
      report.pass("Yeni kayit ana listede goruldu", rowAfterCreate.join(" | "), { screenshot: listAfterCreateScreenshot });
    } else {
      report.fail("Yeni kayit ana listede bulunamadi", `Aranan: hesapNo=${HESAP_NO}, musteriAdi=${MUSTERI_ADI_BEKLENEN}`, {
        screenshot: listAfterCreateScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 8: Kaydi ac (Duzenle), kimlik alanlarinin kilitli oldugunu dogrula ---
    // Satiri tiklayarak duzenleme formunu ac (listedeki tek "10002" satiri).
    const rowClicked = await page.evaluate((hesapNo) => {
      const rows = Array.from(document.querySelectorAll("tbody tr"));
      const target = rows.find((r) => r.textContent.includes(hesapNo));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, HESAP_NO);
    if (!rowClicked) {
      report.fail("Duzenleme icin satir tiklanamadi", `hesapNo=${HESAP_NO} satiri DOM'da bulunamadi`, {
        diagnostics: diagnostics.getLogs(),
      });
    }
    await new Promise((r) => setTimeout(r, 400));

    const disabledStates = await getSelectDisabledStates(page);
    const editOpenScreenshot = await page.screenshot();
    const kimlikKilitli =
      disabledStates[SELECT.KULLANICI_TIPI]?.disabled === true && disabledStates[SELECT.HESAP_TIPI]?.disabled === true;
    const kontrolAcik =
      disabledStates[SELECT.ALIS]?.disabled === false &&
      disabledStates[SELECT.SATIS]?.disabled === false &&
      disabledStates[SELECT.CARPAN]?.disabled === false;
    if (kimlikKilitli && kontrolAcik) {
      report.pass(
        "Duzenleme modunda kimlik alanlari kilitli, kontrol/limit alanlari acik",
        "Kullanici Tipi + Hesap Tipi disabled=true; Alis/Satis/AcikSatis/Carpan disabled=false",
        { screenshot: editOpenScreenshot }
      );
    } else {
      report.fail(
        "Duzenleme modunda alan kilitleme kurali beklendigi gibi degil",
        `disabledStates=${JSON.stringify(disabledStates)}`,
        { screenshot: editOpenScreenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim 9: Net Varlik Limit Carpani ve bir grup iznini degistir, kaydet ---
    await selectDropdownByIndex(page, SELECT.CARPAN, "5");
    await setSwitchByIndex(page, SWITCH.GRUP_B_ALIS, true);
    await clickButtonByText(page, "Kaydet");
    const editToast = await waitForToast(page);
    const editToastScreenshot = await page.screenshot();
    if (editToast && editToast.includes("kaydedildi")) {
      report.pass("Duzenleme sonrasi basari toast'i goruldu", editToast, { screenshot: editToastScreenshot });
    } else {
      report.fail("Duzenleme sonrasi basari toast'i goruntenmedi", editToast ?? "(toast bulunamadi)", {
        screenshot: editToastScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 10: Veritabaninda guncellenmis degerleri dogrula ---
    await new Promise((r) => setTimeout(r, 500));
    const updatedRows = await runQuery(HISSE_RISK_QUERY);
    report.sql("Veritabani sorgusu calistirildi (duzenleme sonrasi)", HISSE_RISK_QUERY, updatedRows);
    if (updatedRows.length === 1 && updatedRows[0].net_varlik_limit_carpani === "5" && updatedRows[0].grup_b_alis_yapabilir === "1") {
      report.pass(
        "Veritabaninda Net Varlik Limit Carpani ve B Grubu Alis izni guncellendi",
        `carpan=${updatedRows[0].net_varlik_limit_carpani}, grupBAlisYapabilir=${updatedRows[0].grup_b_alis_yapabilir}`
      );
    } else {
      report.fail("Veritabanindaki guncelleme beklenen degerlerle eslesmedi", JSON.stringify(updatedRows), {
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 11: Sil -> AlertDialog onayi -> silme ---
    // Kaydet basarili oldugunda form otomatik kapanir (bkz.
    // saveMutation.onSuccess) - "Sil" butonunu gormek icin satiri tekrar
    // tiklayip duzenleme formunu yeniden acmak gerekiyor.
    await page.evaluate((hesapNo) => {
      const rows = Array.from(document.querySelectorAll("tbody tr"));
      const target = rows.find((r) => r.textContent.includes(hesapNo));
      if (target) target.click();
    }, HESAP_NO);
    await new Promise((r) => setTimeout(r, 400));

    await clickButtonByText(page, "Sil");
    await new Promise((r) => setTimeout(r, 400));
    const confirmDialogScreenshot = await page.screenshot();
    const dialogText = await page.evaluate(() => document.querySelector('[role="alertdialog"]')?.textContent ?? "");
    if (dialogText.includes("silinsin mi")) {
      report.pass("Silme onay dialogu acildi", dialogText.trim(), { screenshot: confirmDialogScreenshot });
    } else {
      report.fail("Silme onay dialogu beklendigi gibi acilmadi", dialogText || "(dialog bulunamadi)", {
        screenshot: confirmDialogScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    await clickButtonByTextWithin(page, '[role="alertdialog"]', "Sil");
    const deleteToast = await waitForToast(page);
    const deleteToastScreenshot = await page.screenshot();
    if (deleteToast && deleteToast.includes("silindi")) {
      report.pass("Silme basari toast'i goruldu", deleteToast, { screenshot: deleteToastScreenshot });
    } else {
      report.fail("Silme basari toast'i goruntenmedi", deleteToast ?? "(toast bulunamadi)", {
        screenshot: deleteToastScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // --- Adim 12: Veritabaninda ve listede kaydin kalkti dogrulanmasi ---
    await new Promise((r) => setTimeout(r, 500));
    const afterDeleteRows = await runQuery(HISSE_RISK_QUERY);
    report.sql("Veritabani sorgusu calistirildi (silme sonrasi)", HISSE_RISK_QUERY, afterDeleteRows);
    if (afterDeleteRows.length === 0) {
      report.pass("Veritabaninda kayit silindi", `hesapNo=${HESAP_NO} icin 0 satir kaldi`);
      createdId = null;
    } else {
      report.fail("Veritabaninda kayit hala mevcut", JSON.stringify(afterDeleteRows), { diagnostics: diagnostics.getLogs() });
    }

    const rowAfterDelete = await findTableRow(page, [HESAP_NO, MUSTERI_ADI_BEKLENEN]);
    const listAfterDeleteScreenshot = await page.screenshot();
    if (!rowAfterDelete) {
      report.pass("Silinen kayit ana listede artik goruntenmiyor", null, { screenshot: listAfterDeleteScreenshot });
    } else {
      report.fail("Silinen kayit hala listede goruntuleniyor", rowAfterDelete.join(" | "), {
        screenshot: listAfterDeleteScreenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }
  } finally {
    if (browser) await browser.close();
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  // Guvenlik agi: UI akisi herhangi bir noktada FAIL olup script erken
  // bittiyse, olusturulan test kaydi kalinti birakmasin diye dogrudan
  // DB'den silinir - kalici suite hicbir zaman kirletilmemeli.
  const leftover = await runQuery(HISSE_RISK_QUERY);
  if (leftover.length > 0) {
    console.log(`\nGuvenlik agi: hesapNo=${HESAP_NO} icin ${leftover.length} kalinti kayit bulundu, siliniyor...`);
    for (const row of leftover) {
      await runQuery(`DELETE FROM hisse_risk_parametreleri WHERE hisse_risk_parametre_id = ${row.hisse_risk_parametre_id};`);
    }
    console.log("Temizlik tamamlandi.");
  } else {
    console.log("\nTemizlik dogrulandi: hesapNo=10002 icin kalinti kayit yok.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport(`${SCENARIO_NAME} (CRASH)`);
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `hisse-risk-parametreleri-kayit-yasam-dongusu-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  // Guvenlik agi: crash sonrasi da kalinti test kaydi olabilir, dogrudan DB'den temizle.
  try {
    const { runQuery: rq } = require("../../helpers/db");
    const leftover = await rq(
      "SELECT h.hisse_risk_parametre_id FROM hisse_risk_parametreleri h " +
        "JOIN accounts a ON a.account_id = h.account_id WHERE a.hesap_no = '10002';"
    );
    for (const row of leftover) {
      await rq(`DELETE FROM hisse_risk_parametreleri WHERE hisse_risk_parametre_id = ${row.hisse_risk_parametre_id};`);
    }
    if (leftover.length > 0) console.log(`Crash guvenlik agi: ${leftover.length} kalinti kayit temizlendi.`);
  } catch (cleanupErr) {
    console.error("Crash sonrasi DB temizligi de basarisiz oldu:", cleanupErr);
  }
  process.exit(1);
});
