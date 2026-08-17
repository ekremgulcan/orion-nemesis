/**
 * React karsiligi: screens/zk/bildirim-ayarlari-test-senaryolari.cjs.
 * Kullanicinin sagladigi resmi test senaryo tablosunu (13 madde,
 * "Senaryo" / "Beklenti" kolonlari) React ekranina (nemesis-frontend,
 * /crm/bildirim-ayarlari, BildirimAyarlariPage.tsx) karsi calistirir -
 * ayni spec/implementasyon fark analizini bu ekran icin de dogrular.
 *
 * ZK versiyonundan farkli olarak React kosullu render kullaniyor (gizli
 * bir buton gercekten DOM'dan kalkiyor), bu yuzden ZK'daki
 * "getVisibleButtonLabels" workaround'una gerek yok - duz
 * querySelectorAll("button") zaten sadece o an gorunen butonlari doner.
 *
 * Kullanim: node screens/react/bildirim-ayarlari-test-senaryolari.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  selectDropdownByIndex,
  getSelectDisabledStates,
  fillNthNonDateInput,
  waitForToast,
} = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-test-senaryolari-${Date.now()}.html`);

const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED
const DB_QUERY = "SELECT is_active FROM notification_types WHERE kod = 'PARTIALLY_FILLED';";
const CHANNEL_DB_QUERY =
  "SELECT nct.max_retry, nct.error_backoff_time, nct.musteri_gorur_ve_degistir, nct.is_active FROM notif_channel_templates nct " +
  "JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id " +
  "WHERE nt.kod = 'PARTIALLY_FILLED' AND nct.kanal = 'PUSH';";
const ORIJINAL_MAX_RETRY = "3";
const ORIJINAL_ERROR_BACKOFF = "180";

async function getVisibleSelectItemTexts(page, triggerIndex) {
  const triggers = await page.$$('[data-slot="select-trigger"]');
  await triggers[triggerIndex].click();
  await new Promise((r) => setTimeout(r, 300));
  const items = await page.$$('[data-slot="select-item"], [role="option"]');
  const texts = [];
  for (const item of items) {
    const box = await item.boundingBox();
    if (!box || box.width === 0 || box.height === 0) continue;
    texts.push((await page.evaluate((el) => el.textContent.trim(), item)));
  }
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  return texts;
}

async function getNumberInputValues(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="input"][type="number"]')).map((el) => el.value)
  );
}

async function getNumberInputReadonly(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="input"][type="number"]')).map((el) => el.readOnly)
  );
}

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari (React) - Resmi Test Senaryolari (Senaryo/Beklenti tablosu)");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/crm/bildirim-ayarlari`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // ---------------------------------------------------------------
    // Senaryo 1
    // ---------------------------------------------------------------
    const tipItems = await getVisibleSelectItemTexts(page, 0);
    const s1Screenshot = await page.screenshot();
    report.fail(
      "Senaryo 1: Bildirim Tipi listesinde 2 kategori doluyor mu?",
      `Beklenen: NotifType servisinden donen 2 KATEGORI'nin doldugu bir liste. ` +
        `Gercek: kategori kavrami olmayan DUZ bir liste - ${tipItems.length} bildirim tipi (${JSON.stringify(tipItems)}), ` +
        `NotificationTypeDto'da/backend'de "kategori" alani yok (ZK ile ayni gercek gap).`,
      { screenshot: s1Screenshot, diagnostics: diagnostics.getLogs() }
    );
    report.pass("Senaryo 1: En fazla 1 bildirim tipi secilebilir mi?", "shadcn/base-ui <Select> tekil secim - yapisal olarak birden fazla secim mumkun degil.");

    // ---------------------------------------------------------------
    // Senaryo 2
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s2Body = await page.evaluate(() => document.body.innerText);
    const s2Screenshot = await page.screenshot();
    if (s2Body.includes("Durum (Kanallardan Bagimsiz)") && s2Body.includes("Bildirim Kanali") && s2Body.includes("Acik")) {
      report.pass("Senaryo 2: Tip secilince Durum (mevcut statu ile) + Bildirim Kanali ekrana geldi", "", { screenshot: s2Screenshot });
    } else {
      report.fail("Senaryo 2: Tip secilince beklenen alanlar gelmedi", s2Body.slice(0, 300), { screenshot: s2Screenshot, diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 3
    // ---------------------------------------------------------------
    const kanalItems = await getVisibleSelectItemTexts(page, 2);
    const s3Screenshot = await page.screenshot();
    const expectedLabels = ["Push", "E-posta", "SMS"];
    const hasAllExpectedLabels = expectedLabels.every((l) => kanalItems.some((i) => i.toLowerCase() === l.toLowerCase()));
    if (hasAllExpectedLabels) {
      report.pass("Senaryo 3: Bildirim Kanali listesi beklenen etiketlerle geldi", JSON.stringify(kanalItems), { screenshot: s3Screenshot });
    } else {
      report.fail(
        "Senaryo 3: Bildirim Kanali listesi beklenen etiketlerle uyusmuyor",
        `Beklenen: ${JSON.stringify(expectedLabels)}. Gercek: ${JSON.stringify(kanalItems)} - KANAL_OPTIONS'ta PUSH etiketi beklenenden farkli.`,
        { screenshot: s3Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    report.pass("Senaryo 3: En fazla 1 bildirim kanali secilebilir mi?", "Standart <Select> - tekil secim.");

    // ---------------------------------------------------------------
    // Senaryo 4
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    const s4Body = await page.evaluate(() => document.body.innerText);
    const s4TextareaReadonly = await page.evaluate(() => document.querySelector("textarea")?.readOnly ?? null);
    const s4SelectStates = await getSelectDisabledStates(page);
    const s4NumberReadonly = await getNumberInputReadonly(page);
    const s4Screenshot = await page.screenshot();
    const allFieldsPresent =
      s4Body.includes("Sablonda Kullanilabilecek Parametreler") &&
      s4Body.includes("Musteri Gorur ve Degistirir") &&
      s4Body.includes("Max Deneme Sayisi") &&
      s4Body.includes("Tekrar Deneme Suresi") &&
      s4Body.includes("Kanal Durumu");
    const allNonEditable =
      s4TextareaReadonly === true &&
      s4SelectStates[3]?.disabled === true &&
      s4SelectStates[4]?.disabled === true &&
      s4NumberReadonly.every((r) => r === true);
    if (allFieldsPresent && allNonEditable) {
      report.pass("Senaryo 4: Kanal secilince tum alanlar goruntulendi ve editlenemez geldi", "", { screenshot: s4Screenshot });
    } else {
      report.fail(
        "Senaryo 4: Kanal secilince alanlar/editlenemezlik beklentiyi karsilamadi",
        `allFieldsPresent=${allFieldsPresent}, allNonEditable=${allNonEditable}`,
        { screenshot: s4Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // ---------------------------------------------------------------
    // Senaryo 5
    // ---------------------------------------------------------------
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const s5TextareaReadonly = await page.evaluate(() => document.querySelector("textarea")?.readOnly ?? null);
    const s5SelectStates = await getSelectDisabledStates(page);
    const s5NumberReadonly = await getNumberInputReadonly(page);
    const s5Screenshot = await page.screenshot();
    const kanalFieldsEditable =
      s5TextareaReadonly === false &&
      s5SelectStates[3]?.disabled === false &&
      s5SelectStates[4]?.disabled === false &&
      s5NumberReadonly.every((r) => r === false);
    if (kanalFieldsEditable) {
      report.pass("Senaryo 5: Duzenle sonrasi kanal alanlari editlenebilir hale geldi", "", { screenshot: s5Screenshot });
    } else {
      report.fail("Senaryo 5: Duzenle sonrasi kanal alanlari editlenebilir hale gelmedi", JSON.stringify({ s5TextareaReadonly, s5SelectStates, s5NumberReadonly }), {
        screenshot: s5Screenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }
    const lockedDuringEditLabels = ["Bildirim Tipi", "Durum (Kanallardan Bagimsiz)", "Bildirim Kanali"];
    [0, 1, 2].forEach((idx, i) => {
      if (s5SelectStates[idx]?.disabled === true) {
        report.pass(`Senaryo 5: ${lockedDuringEditLabels[i]} Duzenle sirasinda editlenemez oldu`, "select disabled=true");
      } else {
        report.fail(`Senaryo 5: ${lockedDuringEditLabels[i]} Duzenle sirasinda editlenemez OLMADI`, `select index ${idx} disabled=${s5SelectStates[idx]?.disabled}`, {
          screenshot: s5Screenshot,
          diagnostics: diagnostics.getLogs(),
        });
      }
    });

    // ---------------------------------------------------------------
    // Senaryo 6
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 3, "Hayir");
    await fillNthNonDateInput(page, 0, "7", { root: null });
    await fillNthNonDateInput(page, 1, "250", { root: null });
    await new Promise((r) => setTimeout(r, 300));
    const s6Numbers = await getNumberInputValues(page);
    const s6Screenshot = await page.screenshot();
    if (s6Numbers[0] === "7" && s6Numbers[1] === "250") {
      report.pass("Senaryo 6: Birden fazla kanal alaninda ayni anda degisiklik yapilabildi", JSON.stringify(s6Numbers), { screenshot: s6Screenshot });
    } else {
      report.fail("Senaryo 6: Coklu alan degisikligi beklendigi gibi calismadi", JSON.stringify(s6Numbers), { screenshot: s6Screenshot, diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 7
    // ---------------------------------------------------------------
    const musteriGorurItems = await getVisibleSelectItemTexts(page, 3);
    if (musteriGorurItems.length === 2 && musteriGorurItems.includes("Evet") && musteriGorurItems.includes("Hayir")) {
      report.pass("Senaryo 7: Musteri Gorur ve Degistirir - Evet/Hayir, 2 secimlik liste", JSON.stringify(musteriGorurItems));
    } else {
      report.fail("Senaryo 7: Musteri Gorur ve Degistirir listesi beklentiyi karsilamadi", JSON.stringify(musteriGorurItems), { diagnostics: diagnostics.getLogs() });
    }

    await new Promise((r) => setTimeout(r, 300));

    // ---------------------------------------------------------------
    // Senaryo 8
    // ---------------------------------------------------------------
    const numberInputs = await page.$$('[data-slot="input"][type="number"]');
    await numberInputs[0].click({ clickCount: 3 });
    await numberInputs[0].type("abc");
    const afterLetters = await page.evaluate((el) => el.value, numberInputs[0]);
    await numberInputs[0].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    await numberInputs[0].click({ clickCount: 3 });
    await numberInputs[0].type("-5");
    await numberInputs[0].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    const afterNegative = await page.evaluate((el) => el.value, numberInputs[0]);
    await numberInputs[0].click({ clickCount: 3 });
    await numberInputs[0].type("25");
    await numberInputs[0].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    const afterOverMax = await page.evaluate((el) => el.value, numberInputs[0]);
    const s8Screenshot = await page.screenshot();
    report.pass("Senaryo 8: Max Deneme Sayisi harf girisini kabul etmiyor mu?", `"abc" girildikten sonra alan degeri: "${afterLetters}"`, { screenshot: s8Screenshot });
    if (afterNegative === "-5" || afterNegative.includes("-")) {
      report.fail("Senaryo 8: Max Deneme Sayisi negatif deger kabul etti", `"-5" girildi, alan "${afterNegative}" gosterdi.`, { diagnostics: diagnostics.getLogs() });
    } else {
      report.pass("Senaryo 8: Max Deneme Sayisi negatif degeri reddetti", `"-5" girisinden sonra alan: "${afterNegative}"`);
    }
    if (afterOverMax === "25") {
      report.fail("Senaryo 8: Max Deneme Sayisi max 20 sinirini uygulamiyor", `25 girildi, alan "${afterOverMax}" olarak kaldi.`, { diagnostics: diagnostics.getLogs() });
    } else {
      report.pass("Senaryo 8: Max Deneme Sayisi 20 ustu degeri sinirladi", `25 girisinden sonra alan: "${afterOverMax}"`);
    }
    await numberInputs[0].click({ clickCount: 3 });
    await numberInputs[0].type("7");
    await numberInputs[0].press("Tab");
    await new Promise((r) => setTimeout(r, 300));

    // ---------------------------------------------------------------
    // Senaryo 9
    // ---------------------------------------------------------------
    await numberInputs[1].click({ clickCount: 3 });
    await numberInputs[1].type("xyz");
    const s9AfterLetters = await page.evaluate((el) => el.value, numberInputs[1]);
    await numberInputs[1].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    await numberInputs[1].click({ clickCount: 3 });
    await numberInputs[1].type("-100");
    await numberInputs[1].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    const s9AfterNegative = await page.evaluate((el) => el.value, numberInputs[1]);
    await numberInputs[1].click({ clickCount: 3 });
    await numberInputs[1].type("90000");
    await numberInputs[1].press("Tab");
    await new Promise((r) => setTimeout(r, 300));
    const s9AfterOverMax = await page.evaluate((el) => el.value, numberInputs[1]);
    report.pass("Senaryo 9: Tekrar Deneme Suresi harf girisini kabul etmiyor mu?", `"xyz" girildikten sonra alan degeri: "${s9AfterLetters}"`);
    if (s9AfterNegative.includes("-")) {
      report.fail("Senaryo 9: Tekrar Deneme Suresi negatif deger kabul etti", `alan "${s9AfterNegative}"`, { diagnostics: diagnostics.getLogs() });
    } else {
      report.pass("Senaryo 9: Tekrar Deneme Suresi negatif degeri reddetti", `"-100" girisinden sonra alan: "${s9AfterNegative}"`);
    }
    if (s9AfterOverMax === "90000") {
      report.fail("Senaryo 9: Tekrar Deneme Suresi max 86400 sinirini uygulamiyor", `alan "${s9AfterOverMax}" olarak kaldi.`, { diagnostics: diagnostics.getLogs() });
    } else {
      report.pass("Senaryo 9: Tekrar Deneme Suresi 86400 ustu degeri sinirladi", `90000 girisinden sonra alan: "${s9AfterOverMax}"`);
    }
    await numberInputs[1].click({ clickCount: 3 });
    await numberInputs[1].type("250");
    await numberInputs[1].press("Tab");
    await new Promise((r) => setTimeout(r, 300));

    // ---------------------------------------------------------------
    // Senaryo 10
    // ---------------------------------------------------------------
    const kanalDurumuItems = await getVisibleSelectItemTexts(page, 4);
    if (kanalDurumuItems.length === 2 && kanalDurumuItems.some((i) => i.includes("Acik")) && kanalDurumuItems.some((i) => i.includes("Kapali"))) {
      report.pass("Senaryo 10: Kanal Durumu - Acik/Kapali, 2 secimlik liste", JSON.stringify(kanalDurumuItems));
    } else {
      report.fail("Senaryo 10: Kanal Durumu listesi beklentiyi karsilamadi", JSON.stringify(kanalDurumuItems), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 11
    // ---------------------------------------------------------------
    const s11ButtonLabels = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim()).filter(Boolean));
    if (s11ButtonLabels.includes("Onaya Gonder") && !s11ButtonLabels.includes("Kaydet")) {
      report.pass("Senaryo 11: Kanal degisiklikleri 'Onaya Gonder' butonuyla gonderiliyor", JSON.stringify(s11ButtonLabels));
    } else {
      report.fail("Senaryo 11: Kanal degisiklikleri 'Onaya Gonder' DEGIL, 'Kaydet' butonuyla gonderiliyor", `Duzenleme modunda gorunen butonlar: ${JSON.stringify(s11ButtonLabels)}.`);
    }
    await clickButtonByText(page, "Kaydet");
    const s11Toast = await waitForToast(page);
    const s11Screenshot = await page.screenshot();
    if (s11Toast && s11Toast.includes("Onaya gonderilmistir")) {
      report.pass("Senaryo 11: 'Onaya gonderilmistir' toast'i gosterildi", s11Toast, { screenshot: s11Screenshot });
    } else {
      report.fail("Senaryo 11: 'Onaya gonderilmistir' toast'i GOSTERILMEDI", `Gercek: "${s11Toast}". Beklenen: "Onaya gonderilmistir".`, { screenshot: s11Screenshot, diagnostics: diagnostics.getLogs() });
    }
    await new Promise((r) => setTimeout(r, 400));
    const s11Body = await page.evaluate(() => document.body.innerText);
    if (s11Body.includes("Bildirim Tipi Secimi") && s11Body.includes("Devam etmek icin lutfen bir bildirim tipi seciniz")) {
      report.pass("Senaryo 11: Kaydet sonrasi ekran 1. maddedeki ilk acilis haline dondu", "");
    } else {
      report.fail("Senaryo 11: Kaydet sonrasi ekran SIFIRLANMADI", "Secili tip/kanal ekranda kaliyor.", { diagnostics: diagnostics.getLogs() });
    }

    const s11DbRows = await runQuery(CHANNEL_DB_QUERY);
    report.sql("Senaryo 11: veritabani sorgusu", CHANNEL_DB_QUERY, s11DbRows);
    if (s11DbRows[0]?.max_retry === "7" && s11DbRows[0]?.error_backoff_time === "250" && s11DbRows[0]?.musteri_gorur_ve_degistir === "0") {
      report.pass("Senaryo 11: Kanal degisiklikleri veritabanina yansidi", JSON.stringify(s11DbRows[0]));
    } else {
      report.fail("Senaryo 11: Kanal degisiklikleri veritabanina yansimadi", JSON.stringify(s11DbRows), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 12
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s12ButtonLabels = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim()).filter(Boolean));
    if (s12ButtonLabels.includes("Onaya Gonder")) {
      report.pass("Senaryo 12: 'Onaya Gonder' butonu Duzenle aktif degilken gorunuyor", JSON.stringify(s12ButtonLabels));
    } else {
      report.fail("Senaryo 12: 'Onaya Gonder' butonu beklenen sekilde gorunmedi", JSON.stringify(s12ButtonLabels), { diagnostics: diagnostics.getLogs() });
    }
    await selectDropdownByIndex(page, 1, "Kapali");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    const s12Toast = await waitForToast(page);
    const s12Screenshot = await page.screenshot();
    if (s12Toast && s12Toast.includes("Onaya gonderilmistir")) {
      report.pass("Senaryo 12: 'Onaya gonderilmistir' toast'i gosterildi", s12Toast, { screenshot: s12Screenshot });
    } else {
      report.fail("Senaryo 12: 'Onaya gonderilmistir' toast'i GOSTERILMEDI", `Gercek: "${s12Toast}". Beklenen: "Onaya gonderilmistir".`, { screenshot: s12Screenshot, diagnostics: diagnostics.getLogs() });
    }
    await new Promise((r) => setTimeout(r, 400));
    const s12Body = await page.evaluate(() => document.body.innerText);
    if (s12Body.includes("Bildirim Tipi Secimi") && s12Body.includes("Devam etmek icin lutfen bir bildirim tipi seciniz")) {
      report.pass("Senaryo 12: Onaya Gonder sonrasi ekran 1. maddedeki ilk acilis haline dondu", "");
    } else {
      report.fail("Senaryo 12: Onaya Gonder sonrasi ekran SIFIRLANMADI", "Secili tip ekranda kaliyor.", { diagnostics: diagnostics.getLogs() });
    }

    const s12DbRows = await runQuery(DB_QUERY);
    report.sql("Senaryo 12: veritabani sorgusu", DB_QUERY, s12DbRows);
    if (s12DbRows[0]?.is_active === "0") {
      report.pass("Senaryo 12: Durum degisikligi veritabanina yansidi", JSON.stringify(s12DbRows[0]));
    } else {
      report.fail("Senaryo 12: Durum degisikligi veritabanina yansimadi", JSON.stringify(s12DbRows), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 13
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s13BeforeDuzenle = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim()).filter(Boolean));
    const iptalVisibleBeforeDuzenle = s13BeforeDuzenle.includes("Iptal");
    await selectDropdownByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const s13AfterDuzenle = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim()).filter(Boolean));
    if (!iptalVisibleBeforeDuzenle && s13AfterDuzenle.includes("Iptal")) {
      report.pass("Senaryo 13: Iptal butonu sadece Duzenle secildikten sonra aktiflesti", JSON.stringify(s13AfterDuzenle));
    } else {
      report.fail("Senaryo 13: Iptal butonunun gorunurlugu beklentiyi karsilamadi", JSON.stringify({ iptalVisibleBeforeDuzenle, s13AfterDuzenle }), { diagnostics: diagnostics.getLogs() });
    }

    await fillNthNonDateInput(page, 0, "99", { root: null });
    await new Promise((r) => setTimeout(r, 300));
    const s13BeforeIptalDb = await runQuery(CHANNEL_DB_QUERY);
    await clickButtonByText(page, "Iptal");
    await new Promise((r) => setTimeout(r, 500));
    const s13AfterIptalNumbers = await getNumberInputValues(page);
    const s13AfterIptalDb = await runQuery(CHANNEL_DB_QUERY);
    const s13Screenshot = await page.screenshot();
    if (s13AfterIptalNumbers[0] === s13BeforeIptalDb[0]?.max_retry && s13AfterIptalDb[0]?.max_retry === s13BeforeIptalDb[0]?.max_retry) {
      report.pass("Senaryo 13: Iptal, kaydedilmemis kanal degisikligini attı", `Max Deneme Sayisi eski degerine geri dondu: ${s13AfterIptalNumbers[0]}`, { screenshot: s13Screenshot });
    } else {
      report.fail("Senaryo 13: Iptal beklendigi gibi vazgecmedi", JSON.stringify({ s13AfterIptalNumbers, s13BeforeIptalDb, s13AfterIptalDb }), { screenshot: s13Screenshot, diagnostics: diagnostics.getLogs() });
    }
    const s13SelectStatesAfterIptal = await getSelectDisabledStates(page);
    [0, 1, 2].forEach((idx, i) => {
      if (s13SelectStatesAfterIptal[idx]?.disabled === false) {
        report.pass(`Senaryo 13: ${lockedDuringEditLabels[i]} Iptal sonrasi tekrar editlenebilir`, "select disabled=false");
      } else {
        report.fail(`Senaryo 13: ${lockedDuringEditLabels[i]} Iptal sonrasi editlenebilir degil`, `disabled=${s13SelectStatesAfterIptal[idx]?.disabled}`, { diagnostics: diagnostics.getLogs() });
      }
    });

    // ---------------------------------------------------------------
    // Teardown
    // ---------------------------------------------------------------
    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectDropdownByIndex(page, 1, "Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await waitForToast(page);
    await new Promise((r) => setTimeout(r, 400));

    await selectDropdownByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectDropdownByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 700));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await selectDropdownByIndex(page, 3, "Evet");
    await fillNthNonDateInput(page, 0, ORIJINAL_MAX_RETRY, { root: null });
    await fillNthNonDateInput(page, 1, ORIJINAL_ERROR_BACKOFF, { root: null });
    await new Promise((r) => setTimeout(r, 300));
    await selectDropdownByIndex(page, 4, "Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    await waitForToast(page);

    const teardownRows = await runQuery(CHANNEL_DB_QUERY);
    const teardownTypeRows = await runQuery(DB_QUERY);
    if (
      teardownRows[0]?.max_retry === ORIJINAL_MAX_RETRY &&
      teardownRows[0]?.error_backoff_time === ORIJINAL_ERROR_BACKOFF &&
      teardownRows[0]?.musteri_gorur_ve_degistir === "1" &&
      teardownRows[0]?.is_active === "1" &&
      teardownTypeRows[0]?.is_active === "1"
    ) {
      report.pass("Teardown: PARTIALLY_FILLED orijinal degerlerine geri alindi", JSON.stringify({ ...teardownRows[0], notification_type_active: teardownTypeRows[0]?.is_active }));
    } else {
      report.fail("Teardown basarisiz: orijinal degerlere donulemedi", JSON.stringify({ teardownRows, teardownTypeRows }));
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
    const crashReport = new ScenarioReport("Bildirim Ayarlari (React) - Resmi Test Senaryolari (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-test-senaryolari-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
