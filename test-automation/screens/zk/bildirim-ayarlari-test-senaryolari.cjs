/**
 * Kullanicinin sagladigi resmi test senaryo tablosu (13 madde,
 * "Senaryo" / "Beklenti" kolonlari) ile "Bildirim Ayarlari" ekraninin
 * (ZK: notification/bildirim-ayarlari.zul) GERCEK davranisini
 * karsilastirir. Onceki genel regresyon suite'inden
 * (bildirim-ayarlari-guncelleme.cjs) farkli olarak, bu script MEVCUT
 * UYGULAMANIN "dogru" oldugunu varsaymaz - her adimi spesifik olarak
 * verilen "Beklenti" metnine gore PASS/FAIL isaretler, boylece
 * spec/implementasyon farklari (bug/gap) net biçimde ortaya cikar.
 *
 * Bilinen onemli fark: uygulama "Kaydet" (kanal) ve "Onaya Gonder"
 * (genel durum) olarak IKI AYRI, dogrudan-kaydeden aksiyon iceriyor;
 * senaryo tablosu ise HER IKI aksiyonun de "Onaya Gonder" adiyla,
 * "Onaya gonderilmistir" pop-up'i ile calisip ekrani 1. maddedeki ilk
 * acilis haline sifirlamasini bekliyor. Bu script bu farki dogrudan
 * gozlemleyip raporlar (duzeltmez - bu bir test scripti).
 *
 * Kullanim: node screens/zk/bildirim-ayarlari-test-senaryolari.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  selectComboboxByIndex,
  getComboboxValues,
  getComboboxStates,
  setIntboxByIndex,
  getIntboxValues,
} = require("../../helpers/zk");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

/**
 * ZK "visible=false" bir <button>'i DOM'dan silmiyor, sadece
 * display:none uyguluyor - bu yuzden duz querySelectorAll("button,
 * .z-button") HER ZAMAN o an gizli olan butonlarin metnini de
 * donduruyor (Duzenle/Iptal/Kaydet/Onaya Gonder ayni anda listede
 * gorunuyor). Sadece gercekten gorunur (offsetParent !== null olan)
 * butonlari almak icin bu yardimci fonksiyon kullanilir.
 */
/**
 * Bir intbox'a girilen out-of-range bir deger (orn. "-5" ya da "25")
 * clamp edilene kadar bekler - ZK'nin AU (async update) round-trip
 * suresi sistem yukune gore degisebildigi icin sabit bir sleep (orn.
 * 400/700/1000ms) bazen yetersiz kalip flaky FAIL'e yol aciyordu.
 * `rawValue` (kullanicinin literalde yazdigi deger) hala ekranda
 * duruyorsa "henuz clamp gelmedi" varsayilip kisa araliklarla
 * yoklanir; deger degisince (veya timeout dolunca) son okunan deger
 * dondurulur.
 */
async function pollUntilClamped(input, rawValue, timeoutMs = 4000, intervalMs = 150) {
  const start = Date.now();
  let value = await input.evaluate((el) => el.value);
  while (value === rawValue && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    value = await input.evaluate((el) => el.value);
  }
  return value;
}

/**
 * Ayni AU round-trip yarisi (bkz. pollUntilClamped) ard arda birden
 * fazla intbox'a "gecerli" (clamp gerektirmeyen) bir deger yazilirken
 * de olusabiliyor - daha ONCEKI bir alanin gecikmis yaniti, SONRAKI
 * bir alanin degerini eski haline dondurebiliyor. Bu yuzden coklu
 * intbox yazan akislarda (orn. teardown) her yazimdan sonra bu
 * fonksiyonla deger GERCEKTEN yerlesene kadar beklenir - sabit bir
 * sleep yerine.
 */
async function waitForIntboxValue(page, index, expectedValue, timeoutMs = 4000, intervalMs = 150) {
  const start = Date.now();
  let values = await getIntboxValues(page);
  while (values[index] !== expectedValue && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    values = await getIntboxValues(page);
  }
  return values[index];
}

async function getVisibleButtonLabels(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("button, .z-button"))
      .filter((b) => b.offsetParent !== null)
      .map((b) => b.textContent.trim())
      .filter(Boolean)
  );
}

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-ayarlari-test-senaryolari-${Date.now()}.html`);

// Duzenlenebilir (zorunlu olmayan), kanal sablonu olan bir tip.
const TIP_ADI = "Emrinizin Durumunda Degisiklik Oldu"; // PARTIALLY_FILLED
const DB_QUERY = "SELECT is_active FROM notification_types WHERE kod = 'PARTIALLY_FILLED';";
const CHANNEL_DB_QUERY =
  "SELECT nct.max_retry, nct.error_backoff_time, nct.musteri_gorur_ve_degistir, nct.is_active FROM notif_channel_templates nct " +
  "JOIN notification_types nt ON nt.notification_type_id = nct.notification_type_id " +
  "WHERE nt.kod = 'PARTIALLY_FILLED' AND nct.kanal = 'PUSH';";
const ORIJINAL_MAX_RETRY = "3";
const ORIJINAL_ERROR_BACKOFF = "180";

async function run() {
  const report = new ScenarioReport("Bildirim Ayarlari - Resmi Test Senaryolari (Senaryo/Beklenti tablosu)");
  let browser;

  try {
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/notification/bildirim-ayarlari.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));

    // ---------------------------------------------------------------
    // Senaryo 1: Bildirim Tipi component'i secilir.
    // Beklenti: NotifType servisinde donen 2 kategorinin doldugu
    // gorulur; en fazla 1 bildirim tipi secilebilir.
    // ---------------------------------------------------------------
    const comboButton = await page.$$("input.z-combobox-input");
    await comboButton[0].evaluateHandle((input) => input.closest(".z-combobox")?.querySelector(".z-combobox-button"));
    const tipDropdownButton = await page.evaluateHandle(
      () => document.querySelectorAll("input.z-combobox-input")[0].closest(".z-combobox").querySelector(".z-combobox-button")
    );
    await tipDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
    const tipItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".z-comboitem")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return items.map((el) => el.textContent.trim());
    });
    const senaryo1Screenshot = await page.screenshot();
    // Kapat
    await tipDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 200));
    report.fail(
      "Senaryo 1: Bildirim Tipi listesinde 2 kategori doluyor mu?",
      `Beklenen: NotifType servisinden donen 2 KATEGORI'nin doldugu bir liste. ` +
        `Gercek: kategori kavrami olmayan DUZ (tek seviyeli) bir liste - ${tipItems.length} bildirim tipi ` +
        `(${JSON.stringify(tipItems)}), NotificationType entity'sinde/DB semasinda "kategori" alani yok, ` +
        `tipleriGetir() sadece "sira" alanina gore duz siralanmis 6 satir donduruyor.`,
      { screenshot: senaryo1Screenshot, diagnostics: diagnostics.getLogs() }
    );
    report.pass(
      "Senaryo 1: En fazla 1 bildirim tipi secilebilir mi?",
      "Bildirim Tipi standart bir ZK <combobox> (tekil secim) - yapisal olarak birden fazla secim mumkun degil."
    );

    // ---------------------------------------------------------------
    // Senaryo 2: Bildirim Tipi'nde listenin ilk elemani secilir.
    // Beklenti: Ek bir buton aksiyonu olmaksizin Durum'un servisteki
    // mevcut statusu ile geldigi ve Bildirim Kanali'nin ekrana geldigi
    // gorulur.
    // ---------------------------------------------------------------
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s2Body = await page.evaluate(() => document.body.innerText);
    const s2Combos = await getComboboxValues(page);
    const s2Screenshot = await page.screenshot();
    if (
      s2Body.includes("Durum (Kanallardan Bagimsiz)") &&
      (s2Combos[1]?.includes("Acik") || s2Combos[1]?.includes("Kapali")) &&
      s2Body.includes("Bildirim Kanali")
    ) {
      report.pass(
        "Senaryo 2: Tip secilince Durum (mevcut statu ile) + Bildirim Kanali ekrana geldi",
        `Durum combobox: "${s2Combos[1]}" (ek buton aksiyonu gerekmedi)`,
        { screenshot: s2Screenshot }
      );
    } else {
      report.fail(
        "Senaryo 2: Tip secilince beklenen alanlar gelmedi",
        s2Body.slice(0, 300),
        { screenshot: s2Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // ---------------------------------------------------------------
    // Senaryo 3: Bildirim Kanali component'i secilir.
    // Beklenti: Push, E-posta ve SMS alanlarinin listelendigi gorulur;
    // en fazla 1 kanal secilebilir.
    // ---------------------------------------------------------------
    const kanalDropdownButton = await page.evaluateHandle(
      () => document.querySelectorAll("input.z-combobox-input")[2].closest(".z-combobox").querySelector(".z-combobox-button")
    );
    await kanalDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
    const kanalItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".z-comboitem")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return items.map((el) => el.textContent.trim());
    });
    const s3Screenshot = await page.screenshot();
    await kanalDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 200));
    const expectedLabels = ["Push", "E-posta", "SMS"];
    const hasAllExpectedLabels = expectedLabels.every((l) => kanalItems.some((i) => i.toLowerCase() === l.toLowerCase()));
    if (hasAllExpectedLabels) {
      report.pass("Senaryo 3: Bildirim Kanali listesi beklenen etiketlerle geldi", JSON.stringify(kanalItems), { screenshot: s3Screenshot });
    } else {
      report.fail(
        "Senaryo 3: Bildirim Kanali listesi beklenen etiketlerle uyusmuyor",
        `Beklenen: ${JSON.stringify(expectedLabels)}. Gercek: ${JSON.stringify(kanalItems)} - ` +
          `BildirimKanali.PUSH enum'unun etiketi beklenenden farkli tanimli (bkz. domain/BildirimKanali.java).`,
        { screenshot: s3Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    report.pass("Senaryo 3: En fazla 1 bildirim kanali secilebilir mi?", "Standart ZK <combobox> - tekil secim.");

    // ---------------------------------------------------------------
    // Senaryo 4: Bildirim Kanali'nde listenin ilk elemani secilir.
    // Beklenti: Sablonda Kullanilabilecek Parametreler, Sablon, Musteri
    // Gorur ve Degistirir, Max Deneme Sayisi, Tekrar Deneme Suresi ve
    // Kanal Durumu componentlerinin listelendigi gorulur. Tum alanlar
    // editlenemez gelir (parametreler bu maddeye dahil degil).
    // ---------------------------------------------------------------
    await selectComboboxByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    const s4Body = await page.evaluate(() => document.body.innerText);
    const s4TextareaReadonly = await page.evaluate(() => document.querySelector("textarea")?.readOnly ?? null);
    const s4ComboStates = await getComboboxStates(page);
    const s4IntboxReadonly = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input.z-intbox")).map((el) => el.readOnly)
    );
    const s4Screenshot = await page.screenshot();
    const allFieldsPresent =
      s4Body.includes("Sablonda Kullanilabilecek Parametreler") &&
      s4Body.includes("Sablon") &&
      s4Body.includes("Musteri Gorur ve Degistirir") &&
      s4Body.includes("Max Deneme Sayisi") &&
      s4Body.includes("Tekrar Deneme Suresi") &&
      s4Body.includes("Kanal Durumu");
    const allNonEditable =
      s4TextareaReadonly === true &&
      s4ComboStates[3]?.disabled === true && // Musteri Gorur ve Degistirir
      s4ComboStates[4]?.disabled === true && // Kanal Durumu
      s4IntboxReadonly.every((r) => r === true);
    if (allFieldsPresent && allNonEditable) {
      report.pass(
        "Senaryo 4: Kanal secilince tum alanlar goruntulendi ve editlenemez geldi",
        `Sablon readonly=${s4TextareaReadonly}, intbox readonly=${JSON.stringify(s4IntboxReadonly)}, combo disabled=${JSON.stringify(s4ComboStates.slice(3))}`,
        { screenshot: s4Screenshot }
      );
    } else {
      report.fail(
        "Senaryo 4: Kanal secilince alanlar/editlenemezlik beklentiyi karsilamadi",
        `allFieldsPresent=${allFieldsPresent}, allNonEditable=${allNonEditable}, body=${s4Body.slice(0, 200)}`,
        { screenshot: s4Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    // ---------------------------------------------------------------
    // Senaryo 5: Duzenle butonu secilir.
    // Beklenti: 4. maddedeki editlenemez alanlar editlenebilir hale
    // gelir. Durum(Kanallardan Bagimsiz) component'i editlenemez hale
    // gelir.
    // ---------------------------------------------------------------
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const s5TextareaReadonly = await page.evaluate(() => document.querySelector("textarea")?.readOnly ?? null);
    const s5ComboStates = await getComboboxStates(page);
    const s5IntboxReadonly = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input.z-intbox")).map((el) => el.readOnly)
    );
    const s5Screenshot = await page.screenshot();
    const kanalFieldsEditable =
      s5TextareaReadonly === false &&
      s5ComboStates[3]?.disabled === false &&
      s5ComboStates[4]?.disabled === false &&
      s5IntboxReadonly.every((r) => r === false);
    if (kanalFieldsEditable) {
      report.pass("Senaryo 5: Duzenle sonrasi kanal alanlari editlenebilir hale geldi", "Sablon/Musteri Gorur/Max Deneme/Tekrar Deneme/Kanal Durumu", {
        screenshot: s5Screenshot,
      });
    } else {
      report.fail("Senaryo 5: Duzenle sonrasi kanal alanlari editlenebilir hale gelmedi", JSON.stringify({ s5TextareaReadonly, s5ComboStates, s5IntboxReadonly }), {
        screenshot: s5Screenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }
    // KRITIK KONTROL: Bildirim Tipi (index 0), Durum Kanallardan Bagimsiz
    // (index 1) ve Bildirim Kanali (index 2) - Duzenle sirasinda ucu de
    // kilitlenmeli (kullanici yarim kalmis bir kanal duzenlemesini
    // ortada birakip tip/kanal degistiremesin).
    const lockedDuringEditLabels = ["Bildirim Tipi", "Durum (Kanallardan Bagimsiz)", "Bildirim Kanali"];
    [0, 1, 2].forEach((idx, i) => {
      if (s5ComboStates[idx]?.disabled === true) {
        report.pass(`Senaryo 5: ${lockedDuringEditLabels[i]} Duzenle sirasinda editlenemez oldu`, "combobox disabled=true");
      } else {
        report.fail(
          `Senaryo 5: ${lockedDuringEditLabels[i]} Duzenle sirasinda editlenemez OLMADI - GERCEK BUG`,
          `combobox index ${idx} disabled=${s5ComboStates[idx]?.disabled} (beklenen: true).`,
          { screenshot: s5Screenshot, diagnostics: diagnostics.getLogs() }
        );
      }
    });

    // ---------------------------------------------------------------
    // Senaryo 6: Kanal componentlerinde duzenleme yapilir.
    // Beklenti: Birden fazla alanda degisiklik yapilabildigi gorulur.
    // ---------------------------------------------------------------
    await selectComboboxByIndex(page, 3, "Hayir");
    await setIntboxByIndex(page, 0, "7");
    // Ard arda iki intbox bind istegi, birbirinin AU round-trip'ini
    // "gecebilir" (stale bir yanit daha yeni degeri ezebilir) - her
    // bind'in oturmasini bekleyerek bu yarisi ortadan kaldirilir.
    await new Promise((r) => setTimeout(r, 350));
    await setIntboxByIndex(page, 1, "250");
    await new Promise((r) => setTimeout(r, 300));
    const s6Combos = await getComboboxValues(page);
    const s6Intboxes = await getIntboxValues(page);
    const s6Screenshot = await page.screenshot();
    if (s6Combos[3]?.includes("Hayir") && s6Intboxes[0] === "7" && s6Intboxes[1] === "250") {
      report.pass("Senaryo 6: Birden fazla kanal alaninda ayni anda degisiklik yapilabildi", `Musteri Gorur=${s6Combos[3]}, MaxRetry=${s6Intboxes[0]}, ErrorBackoff=${s6Intboxes[1]}`, {
        screenshot: s6Screenshot,
      });
    } else {
      report.fail("Senaryo 6: Coklu alan degisikligi beklendigi gibi calismadi", JSON.stringify({ s6Combos, s6Intboxes }), {
        screenshot: s6Screenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }

    // ---------------------------------------------------------------
    // Senaryo 7: Musteri Gorur ve Degistirir - Evet/Hayir, tekil secim.
    // ---------------------------------------------------------------
    const musteriGorurDropdownButton = await page.evaluateHandle(
      () => document.querySelectorAll("input.z-combobox-input")[3].closest(".z-combobox").querySelector(".z-combobox-button")
    );
    await musteriGorurDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
    const musteriGorurItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".z-comboitem")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return items.map((el) => el.textContent.trim());
    });
    await musteriGorurDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 200));
    if (musteriGorurItems.length === 2 && musteriGorurItems.includes("Evet") && musteriGorurItems.includes("Hayir")) {
      report.pass("Senaryo 7: Musteri Gorur ve Degistirir - Evet/Hayir, 2 secimlik liste", JSON.stringify(musteriGorurItems));
    } else {
      report.fail("Senaryo 7: Musteri Gorur ve Degistirir listesi beklentiyi karsilamadi", JSON.stringify(musteriGorurItems), {
        diagnostics: diagnostics.getLogs(),
      });
    }

    // Onceki adimlarin (Senaryo 6/7) AU istekleri tam yerlesmeden buraya
    // gecilirse ust uste binen guncellemeler yuzunden ilk okuma yanlis
    // (henuz taze olmayan) bir deger donebiliyor - ekstra bekleme.
    await new Promise((r) => setTimeout(r, 500));

    // ---------------------------------------------------------------
    // Senaryo 8: Max Deneme Sayisi - sadece numerik, 0 ve pozitif dogal
    // sayilar, max 20.
    // ---------------------------------------------------------------
    const maxRetryInputs = await page.$$("input.z-intbox");
    await maxRetryInputs[0].click({ clickCount: 3 });
    await maxRetryInputs[0].type("abc");
    const afterLetters = await page.evaluate((el) => el.value, maxRetryInputs[0]);
    await maxRetryInputs[0].press("Tab"); // "abc" adimini tam blur'la kapat, sonraki secim/yazimin temiz bir input state'inden baslamasini garantile
    await new Promise((r) => setTimeout(r, 300));
    await maxRetryInputs[0].click({ clickCount: 3 });
    await maxRetryInputs[0].type("-5");
    await maxRetryInputs[0].press("Tab"); // blur tetiklenmeden @bind setter'i (ve dolayisiyla server-side clamp) calismaz
    const afterNegative = await pollUntilClamped(maxRetryInputs[0], "-5");
    await maxRetryInputs[0].click({ clickCount: 3 });
    await maxRetryInputs[0].type("25");
    await maxRetryInputs[0].press("Tab");
    const afterOverMax = await pollUntilClamped(maxRetryInputs[0], "25");
    const s8Screenshot = await page.screenshot();
    report.pass("Senaryo 8: Max Deneme Sayisi harf girisini kabul etmiyor mu?", `"abc" girildikten sonra alan degeri: "${afterLetters}" (bos/degismemis olmali)`, {
      screenshot: s8Screenshot,
    });
    if (afterNegative === "-5" || afterNegative.includes("-")) {
      report.fail(
        "Senaryo 8: Max Deneme Sayisi negatif deger kabul etti - GERCEK BUG",
        `Beklenen: sadece 0 ve pozitif dogal sayilar. Gercek: "-5" girildi ve alan "${afterNegative}" gosterdi - ` +
          `intbox'ta herhangi bir min="0" constraint'i tanimli degil.`,
        { diagnostics: diagnostics.getLogs() }
      );
    } else {
      report.pass("Senaryo 8: Max Deneme Sayisi negatif degeri reddetti", `"-5" girisinden sonra alan: "${afterNegative}"`);
    }
    if (afterOverMax === "25") {
      report.fail(
        "Senaryo 8: Max Deneme Sayisi max 20 sinirini uygulamiyor - GERCEK BUG",
        `Beklenen: max 20 degerini alir (25 girildiginde reddedilmeli/sinirlanmali). Gercek: alan "${afterOverMax}" olarak kaldi, ` +
          `BildirimAyarlariViewModel#setMaxRetry hicbir dogrulama yapmadan degeri direkt entity'ye yaziyor, .zul'daki <intbox> da constraint tasimiyor.`,
        { diagnostics: diagnostics.getLogs() }
      );
    } else {
      report.pass("Senaryo 8: Max Deneme Sayisi 20 ustu degeri sinirladi/reddetti", `25 girisinden sonra alan: "${afterOverMax}"`);
    }
    await maxRetryInputs[0].click({ clickCount: 3 });
    await maxRetryInputs[0].type("7");
    await maxRetryInputs[0].press("Tab");
    await waitForIntboxValue(page, 0, "7");

    // ---------------------------------------------------------------
    // Senaryo 9: Tekrar Deneme Suresi - sadece numerik, 0 ve pozitif
    // dogal sayilar, max 86400.
    // ---------------------------------------------------------------
    const errorBackoffInputs = await page.$$("input.z-intbox");
    await errorBackoffInputs[1].click({ clickCount: 3 });
    await errorBackoffInputs[1].type("xyz");
    const s9AfterLetters = await page.evaluate((el) => el.value, errorBackoffInputs[1]);
    await errorBackoffInputs[1].press("Tab"); // "xyz" adimini tam blur'la kapat (Senaryo 8'deki "abc" fix'iyle ayni gerekce)
    await new Promise((r) => setTimeout(r, 300));
    await errorBackoffInputs[1].click({ clickCount: 3 });
    await errorBackoffInputs[1].type("-100");
    await errorBackoffInputs[1].press("Tab");
    const s9AfterNegative = await pollUntilClamped(errorBackoffInputs[1], "-100");
    await errorBackoffInputs[1].click({ clickCount: 3 });
    await errorBackoffInputs[1].type("90000");
    await errorBackoffInputs[1].press("Tab");
    const s9AfterOverMax = await pollUntilClamped(errorBackoffInputs[1], "90000");
    report.pass("Senaryo 9: Tekrar Deneme Suresi harf girisini kabul etmiyor mu?", `"xyz" girildikten sonra alan degeri: "${s9AfterLetters}"`);
    if (s9AfterNegative.includes("-")) {
      report.fail(
        "Senaryo 9: Tekrar Deneme Suresi negatif deger kabul etti - GERCEK BUG",
        `Beklenen: sadece 0 ve pozitif dogal sayilar. Gercek: alan "${s9AfterNegative}" - min constraint yok.`,
        { diagnostics: diagnostics.getLogs() }
      );
    } else {
      report.pass("Senaryo 9: Tekrar Deneme Suresi negatif degeri reddetti", `"-100" girisinden sonra alan: "${s9AfterNegative}"`);
    }
    if (s9AfterOverMax === "90000") {
      report.fail(
        "Senaryo 9: Tekrar Deneme Suresi max 86400 sinirini uygulamiyor - GERCEK BUG",
        `Beklenen: max 86400 degerini alir. Gercek: alan "${s9AfterOverMax}" olarak kaldi - max constraint yok.`,
        { diagnostics: diagnostics.getLogs() }
      );
    } else {
      report.pass("Senaryo 9: Tekrar Deneme Suresi 86400 ustu degeri sinirladi/reddetti", `90000 girisinden sonra alan: "${s9AfterOverMax}"`);
    }
    await errorBackoffInputs[1].click({ clickCount: 3 });
    await errorBackoffInputs[1].type("250");
    await errorBackoffInputs[1].press("Tab");
    await waitForIntboxValue(page, 1, "250");

    // ---------------------------------------------------------------
    // Senaryo 10: Kanal Durumu - Acik/Kapali, tekil secim.
    // ---------------------------------------------------------------
    const kanalDurumuDropdownButton = await page.evaluateHandle(
      () => document.querySelectorAll("input.z-combobox-input")[4].closest(".z-combobox").querySelector(".z-combobox-button")
    );
    await kanalDurumuDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
    const kanalDurumuItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".z-comboitem")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return items.map((el) => el.textContent.replace(/\u00A0/g, " ").trim());
    });
    await kanalDurumuDropdownButton.asElement().click();
    await new Promise((r) => setTimeout(r, 200));
    if (kanalDurumuItems.length === 2 && kanalDurumuItems.some((i) => i.includes("Acik")) && kanalDurumuItems.some((i) => i.includes("Kapali"))) {
      report.pass("Senaryo 10: Kanal Durumu - Acik/Kapali, 2 secimlik liste", JSON.stringify(kanalDurumuItems));
    } else {
      report.fail("Senaryo 10: Kanal Durumu listesi beklentiyi karsilamadi", JSON.stringify(kanalDurumuItems), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 11: Kanal componentlerindeki degisikliklerin onaya
    // gonderilmesi.
    // Beklenti: "Onaya Gonder" butonuyla toplu gonderilir, "Onaya
    // gonderilmistir" pop-up'i gosterilir, ekran 1. maddedeki ilk
    // acilis haline doner (temizlenir).
    // ---------------------------------------------------------------
    const s11ButtonLabels = await getVisibleButtonLabels(page);
    if (s11ButtonLabels.includes("Onaya Gonder") && !s11ButtonLabels.includes("Kaydet")) {
      report.pass("Senaryo 11: Kanal degisiklikleri 'Onaya Gonder' butonuyla gonderiliyor", JSON.stringify(s11ButtonLabels));
    } else {
      report.fail(
        "Senaryo 11: Kanal degisiklikleri 'Onaya Gonder' DEGIL, 'Kaydet' butonuyla gonderiliyor - SPEC FARKLILIGI",
        `Duzenleme modunda gorunen butonlar: ${JSON.stringify(s11ButtonLabels)}. Beklenen buton adi: "Onaya Gonder".`
      );
    }
    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1000));
    const s11Body = await page.evaluate(() => document.body.innerText);
    const s11Screenshot = await page.screenshot();
    if (s11Body.includes("Onaya gonderilmistir")) {
      report.pass("Senaryo 11: 'Onaya gonderilmistir' pop-up'i gosterildi", "", { screenshot: s11Screenshot });
    } else {
      report.fail(
        "Senaryo 11: 'Onaya gonderilmistir' pop-up'i GOSTERILMEDI - SPEC FARKLILIGI",
        `Gercek mesaj: "Kanal ayarlari kaydedildi." (BildirimAyarlariViewModel#kanalAyarlariniKaydet, Clients.showNotification). Beklenen: "Onaya gonderilmistir".`,
        { screenshot: s11Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    const s11ResetToInitial = s11Body.includes("Bildirim Tipi Secimi") && s11Body.includes("Devam etmek icin lutfen bir bildirim tipi seciniz");
    if (s11ResetToInitial) {
      report.pass("Senaryo 11: Kaydet sonrasi ekran 1. maddedeki ilk acilis haline dondu", "");
    } else {
      report.fail(
        "Senaryo 11: Kaydet sonrasi ekran SIFIRLANMADI - SPEC FARKLILIGI",
        `Beklenen: ekran temizlenip 'Bildirim Tipi Secimi' baslangic ekranina doner. Gercek: secili tip/kanal ve girilen degerler ekranda kaliyor, ` +
          `kaydetAyarlariniKaydet() sadece selectedTemplate/duzenlemeModu'yu yeniliyor, selectedType/selectedChannel'i sifirlamiyor.`,
        { screenshot: s11Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    const s11DbRows = await runQuery(CHANNEL_DB_QUERY);
    report.sql("Senaryo 11: veritabani sorgusu", CHANNEL_DB_QUERY, s11DbRows);
    if (s11DbRows[0]?.max_retry === "7" && s11DbRows[0]?.error_backoff_time === "250" && s11DbRows[0]?.musteri_gorur_ve_degistir === "0") {
      report.pass("Senaryo 11: Kanal degisiklikleri veritabanina yansidi", JSON.stringify(s11DbRows[0]));
    } else {
      report.fail("Senaryo 11: Kanal degisiklikleri veritabanina yansimadi", JSON.stringify(s11DbRows), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 12: Durum(Kanallardan Bagimsiz) component'inin onaya
    // gonderilmesi.
    // Beklenti: Duzenle aktiflestirilmediği surece calisir, "Onaya
    // Gonder" ile gonderilir, "Onaya gonderilmistir" pop-up'i +
    // ekranin 1. maddedeki ilk acilis haline donmesi.
    // ---------------------------------------------------------------
    // Not: Senaryo 11 zaten ekrani sifirladigi icin (ya da sifirlamadigi
    // icin - yukaridaki bulguya bakin) burada tekrar tipi secip Durum'u
    // degistiriyoruz.
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s12ButtonLabels = await getVisibleButtonLabels(page);
    const s12WorksWithoutDuzenle = s12ButtonLabels.includes("Onaya Gonder") && !s12ButtonLabels.includes("Duzenle") === false; // Duzenle de gorunur olabilir, onemli olan Onaya Gonder'in gorunmesi
    if (s12ButtonLabels.includes("Onaya Gonder")) {
      report.pass("Senaryo 12: 'Onaya Gonder' butonu Duzenle aktif degilken gorunuyor", JSON.stringify(s12ButtonLabels));
    } else {
      report.fail("Senaryo 12: 'Onaya Gonder' butonu beklenen sekilde gorunmedi", JSON.stringify(s12ButtonLabels), { diagnostics: diagnostics.getLogs() });
    }
    await selectComboboxByIndex(page, 1, "\uD83D\uDD34 Kapali");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));
    const s12Body = await page.evaluate(() => document.body.innerText);
    const s12Screenshot = await page.screenshot();
    if (s12Body.includes("Onaya gonderilmistir")) {
      report.pass("Senaryo 12: 'Onaya gonderilmistir' pop-up'i gosterildi", "", { screenshot: s12Screenshot });
    } else {
      report.fail(
        "Senaryo 12: 'Onaya gonderilmistir' pop-up'i GOSTERILMEDI - SPEC FARKLILIGI",
        `Gercek mesaj: "Genel durum guncellendi." (BildirimAyarlariViewModel#onayaGonder, Clients.showNotification). Beklenen: "Onaya gonderilmistir".`,
        { screenshot: s12Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }
    const s12ResetToInitial = s12Body.includes("Bildirim Tipi Secimi") && s12Body.includes("Devam etmek icin lutfen bir bildirim tipi seciniz");
    if (s12ResetToInitial) {
      report.pass("Senaryo 12: Onaya Gonder sonrasi ekran 1. maddedeki ilk acilis haline dondu", "");
    } else {
      report.fail(
        "Senaryo 12: Onaya Gonder sonrasi ekran SIFIRLANMADI - SPEC FARKLILIGI",
        `Beklenen: ekran temizlenip baslangic ekranina doner. Gercek: secili tip ekranda kaliyor (guncel Durum degeriyle), ` +
          `onayaGonder() selectedType'i null'a cekmiyor, sadece taze veriyle yeniliyor.`,
        { screenshot: s12Screenshot, diagnostics: diagnostics.getLogs() }
      );
    }

    const s12DbRows = await runQuery(DB_QUERY);
    report.sql("Senaryo 12: veritabani sorgusu", DB_QUERY, s12DbRows);
    if (s12DbRows[0]?.is_active === "0") {
      report.pass("Senaryo 12: Durum degisikligi veritabanina yansidi", JSON.stringify(s12DbRows[0]));
    } else {
      report.fail("Senaryo 12: Durum degisikligi veritabanina yansimadi", JSON.stringify(s12DbRows), { diagnostics: diagnostics.getLogs() });
    }

    // ---------------------------------------------------------------
    // Senaryo 13: Iptal butonu secilir.
    // Beklenti: Duzenle secildikten sonra aktiflesir, kanal
    // degisikliklerinden vazgecirir, 4. maddedeki fonksiyona doner,
    // Durum(Kanallardan Bagimsiz) tekrar editlenebilir hale gelir.
    // ---------------------------------------------------------------
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    const s13BeforeDuzenle = await getVisibleButtonLabels(page);
    const iptalVisibleBeforeDuzenle = s13BeforeDuzenle.includes("Iptal");
    await selectComboboxByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    const s13AfterDuzenle = await getVisibleButtonLabels(page);
    if (!iptalVisibleBeforeDuzenle && s13AfterDuzenle.includes("Iptal")) {
      report.pass("Senaryo 13: Iptal butonu sadece Duzenle secildikten sonra aktiflesti", JSON.stringify(s13AfterDuzenle));
    } else {
      report.fail("Senaryo 13: Iptal butonunun gorunurlugu beklentiyi karsilamadi", JSON.stringify({ iptalVisibleBeforeDuzenle, s13AfterDuzenle }), {
        diagnostics: diagnostics.getLogs(),
      });
    }

    await setIntboxByIndex(page, 0, "99");
    const s13BeforeIptalDb = await runQuery(CHANNEL_DB_QUERY);
    await clickButtonByText(page, "Iptal");
    await new Promise((r) => setTimeout(r, 500));
    const s13AfterIptalIntbox = await getIntboxValues(page);
    const s13AfterIptalDb = await runQuery(CHANNEL_DB_QUERY);
    const s13Screenshot = await page.screenshot();
    if (s13AfterIptalIntbox[0] === s13BeforeIptalDb[0]?.max_retry && s13AfterIptalDb[0]?.max_retry === s13BeforeIptalDb[0]?.max_retry) {
      report.pass(
        "Senaryo 13: Iptal, kaydedilmemis kanal degisikligini attı (4. maddedeki fonksiyona donuldu)",
        `Max Deneme Sayisi eski degerine geri dondu: ${s13AfterIptalIntbox[0]}`,
        { screenshot: s13Screenshot }
      );
    } else {
      report.fail("Senaryo 13: Iptal beklendigi gibi vazgecmedi", JSON.stringify({ s13AfterIptalIntbox, s13BeforeIptalDb, s13AfterIptalDb }), {
        screenshot: s13Screenshot,
        diagnostics: diagnostics.getLogs(),
      });
    }
    const s13ComboStatesAfterIptal = await getComboboxStates(page);
    [0, 1, 2].forEach((idx, i) => {
      if (s13ComboStatesAfterIptal[idx]?.disabled === false) {
        report.pass(`Senaryo 13: ${lockedDuringEditLabels[i]} Iptal sonrasi tekrar editlenebilir`, "combobox disabled=false");
      } else {
        report.fail(
          `Senaryo 13: ${lockedDuringEditLabels[i]} Iptal sonrasi editlenebilir degil`,
          `disabled=${s13ComboStatesAfterIptal[idx]?.disabled}`,
          { diagnostics: diagnostics.getLogs() }
        );
      }
    });

    // ---------------------------------------------------------------
    // Teardown: PARTIALLY_FILLED'i orijinal degerlerine geri al.
    // ---------------------------------------------------------------
    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectComboboxByIndex(page, 1, "\uD83D\uDFE2 Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Onaya Gonder");
    await new Promise((r) => setTimeout(r, 1000));

    await selectComboboxByIndex(page, 0, TIP_ADI);
    await new Promise((r) => setTimeout(r, 500));
    await selectComboboxByIndex(page, 2, "Push");
    await new Promise((r) => setTimeout(r, 500));
    await clickButtonByText(page, "Duzenle");
    await new Promise((r) => setTimeout(r, 400));
    await selectComboboxByIndex(page, 3, "Evet");
    await new Promise((r) => setTimeout(r, 350));
    await setIntboxByIndex(page, 0, ORIJINAL_MAX_RETRY);
    await waitForIntboxValue(page, 0, ORIJINAL_MAX_RETRY);
    await setIntboxByIndex(page, 1, ORIJINAL_ERROR_BACKOFF);
    await waitForIntboxValue(page, 1, ORIJINAL_ERROR_BACKOFF);
    await selectComboboxByIndex(page, 4, "\uD83D\uDFE2 Acik");
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, "Kaydet");
    await new Promise((r) => setTimeout(r, 1000));

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
    const crashReport = new ScenarioReport("Bildirim Ayarlari - Resmi Test Senaryolari (CRASH)");
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
