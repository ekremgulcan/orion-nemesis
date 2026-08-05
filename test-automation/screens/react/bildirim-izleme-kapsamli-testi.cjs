/**
 * Senaryo: Bildirim Izleme (React: /crm/bildirim-izleme) ekraninin
 * KAPSAMLI dogrulamasi - `bildirim-izleme-filtreleme.cjs`in daha hafif
 * regresyon setinin ustune, tum filtrelerin TEK BASINA ve CESITLI
 * KOMBINASYONLAR halinde, sayfalama + sayfa boyutu degisimiyle
 * birlikte, sifir-sonuc durumunun, "Rapor Olustur"un her iki sekmede
 * de, detay panelinin ve tab/tablo UI regresyonunun dogrulanmasi.
 *
 * Ground truth stratejisi: `notification_events` + `accounts` +
 * `users` join'inin TAM anlik goruntusu tek seferde cekilir, ardindan
 * NotificationEventRepository.BASE_SELECT'teki filtre mantigi
 * (hesapNo/kullaniciAdi/notifHeader icin case-insensitive "contains",
 * status icin tam esitlik, tarih araligi icin dahil-dahil) JS
 * tarafinda BIREBIR yeniden uygulanir - her senaryo icin ayri bir SQL
 * sorgusu yazmak yerine tek bir `expectedRows()` fonksiyonu kullanilir
 * (28 satirlik veri seti bunun icin yeterince kucuk). "Temizle"
 * sonrasi form varsayilaninin `dateTo=dun` OLDUGU (bos degil) her
 * senaryonun etkin filtresine dahil edilir - ekranin gercek
 * davranisini birebir yansitmasi icin.
 *
 * Salt-okunur bir izleme ekrani oldugu icin herhangi bir veri
 * olusturulmaz/silinmez - teardown gerektirmez.
 *
 * Kullanim: node screens/react/bildirim-izleme-kapsamli-testi.cjs
 */
const path = require("node:path");
const { launchBrowser, newPage } = require("../../helpers/browser");
const {
  clickButtonByText,
  getTableRows,
  selectDropdownByIndex,
  waitForToast,
  fillNthNonDateInput,
  fillDateInputByIndex,
} = require("../../helpers/react");
const { runQuery } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `bildirim-izleme-kapsamli-testi-${Date.now()}.html`);

/** Mirrors NotificationEventRepository.BASE_SELECT's filter semantics against an in-memory snapshot. */
function expectedRows(all, { dateFrom, dateTo, hesapNo, kullaniciAdi, notifHeader, status } = {}) {
  return all.filter((r) => {
    if (status && r.status !== status) return false;
    if (dateFrom && r.log_date < dateFrom) return false;
    if (dateTo && r.log_date > dateTo) return false;
    if (hesapNo && !r.hesap_no.toLowerCase().includes(hesapNo.toLowerCase())) return false;
    if (kullaniciAdi && !r.kullanici_adi.toLowerCase().includes(kullaniciAdi.toLowerCase())) return false;
    if (notifHeader && !r.notif_header.toLowerCase().includes(notifHeader.toLowerCase())) return false;
    return true;
  });
}

async function run() {
  const report = new ScenarioReport("Bildirim Izleme (React) - Kapsamli Filtre/Sayfalama/UI Testi");
  let browser;

  try {
    const dateRow = await runQuery(
      "SELECT CAST(SYSUTCDATETIME() AS DATE) AS today, CAST(DATEADD(day,-1,SYSUTCDATETIME()) AS DATE) AS yday;"
    );
    const yesterdayIso = dateRow[0].yday;
    report.info("Sunucu tarihi alindi", `bugun=${dateRow[0].today}, dun=${yesterdayIso}`);

    const all = await runQuery(
      "SELECT e.event_id, e.log_date, e.created, e.status, a.hesap_no, u.kullanici_adi, e.notif_header " +
        "FROM notification_events e JOIN accounts a ON a.account_id = e.account_id JOIN users u ON u.user_id = e.user_id " +
        "ORDER BY e.created DESC;"
    );
    report.sql("Tum bildirim kayitlari (ground truth snapshot)", "SELECT ... ORDER BY e.created DESC", all);

    // "Temizle" sonrasi formun gercek varsayilani: dateFrom bos, dateTo=dun - bu yuzden her senaryonun
    // etkin filtresine (aksi belirtilmedikce) dateTo=dun dahil edilir.
    function effective(overrides) {
      return { dateTo: yesterdayIso, ...overrides };
    }

    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    await page.goto(`${BASE_URL}/crm/bildirim-izleme`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // --- UI regresyon: tab stili (Teminat Onay Ekrani ile eslesen duz/bordered stil) ---
    const tabStyle = await page.evaluate(() => {
      const list = document.querySelector('[data-slot="tabs-list"]');
      const triggers = Array.from(document.querySelectorAll('[data-slot="tabs-trigger"]'));
      return {
        listClass: list ? list.className : null,
        triggerClasses: triggers.map((t) => t.className),
      };
    });
    const tabStyleOk =
      (tabStyle.listClass ?? "").includes("bg-transparent") &&
      tabStyle.triggerClasses.every((c) => c.includes("data-active:bg-accent-muted"));
    if (tabStyleOk) {
      report.pass("Tab stili Teminat Onay Ekrani ile ayni (duz/bordered)", "TabsList bg-transparent + TabsTrigger data-active:bg-accent-muted korunuyor");
    } else {
      report.fail(
        "Tab stili regresyona ugramis",
        `listClass="${tabStyle.listClass}", triggerClasses=${JSON.stringify(tabStyle.triggerClasses)}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Adim: Bugunku Bildirimler (0 satir bekleniyor - DB'de bugune ait mock veri yok) ---
    let rows = await getTableRows(page);
    const todayRows = await runQuery("SELECT event_id FROM notification_events WHERE log_date = CAST(SYSUTCDATETIME() AS DATE);");
    if (rows.length === todayRows.length) {
      report.pass("Bugunku Bildirimler satir sayisi DB ile eslesiyor", `${rows.length} satir`);
    } else {
      report.fail("Bugunku Bildirimler satir sayisi DB ile eslesmiyor", `beklenen ${todayRows.length}, gelen ${rows.length}`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Bugunku Bildirimler sekmesinde Rapor Olustur (0 satirken export hala calismali) ---
    await clickButtonByText(page, "Rapor Olustur");
    const bugunToast = await waitForToast(page, 5000);
    if (bugunToast === "Rapor olusturuldu.") {
      report.pass("Bugunku Bildirimler'de Rapor Olustur (0 satirla) basarili", bugunToast);
    } else {
      report.fail("Bugunku Bildirimler'de Rapor Olustur basarisiz", `gelen toast: "${bugunToast}"`, { diagnostics: diagnostics.getLogs() });
    }

    // --- Gecmis Bildirimler sekmesine gec ---
    const switched = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Gecmis Bildirimler"));
      if (!btn) return false;
      btn.click();
      return true;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (switched) {
      report.pass("Gecmis Bildirimler sekmesine gecildi", null);
    } else {
      report.fail("Gecmis Bildirimler sekmesine gecilemedi", "buton bulunamadi", { diagnostics: diagnostics.getLogs() });
    }

    // --- Bulgu (kozmetik): kapali "Durum" select'i taze render'da "Hepsi" yerine ham "HEPSI" degerini gosteriyor ---
    const freshStatusLabel = await page.evaluate(() => {
      const trigger = document.querySelectorAll('[data-slot="select-trigger"]')[1];
      return trigger?.querySelector('[data-slot="select-value"]')?.textContent?.trim() ?? null;
    });
    if (freshStatusLabel === "Hepsi") {
      report.pass("'Durum' select'i kapaliyken 'Hepsi' etiketini gosteriyor", freshStatusLabel);
    } else {
      report.info(
        "Bulgu (kozmetik): 'Durum' select'i kapaliyken 'Hepsi' yerine ham deger gosteriyor",
        `gorunen="${freshStatusLabel}" - base-ui'nin SelectValue'su ozel render/children verilmedikce esleseni item'in cocuk metnini degil, ham value prop'unu basiyor (SelectItem value="HEPSI">Hepsi</SelectItem>). Islevsel degil, kucuk bir kozmetik tutarsizlik.`
      );
    }

    /**
     * Temizle -> istenen filtreleri uygula -> Listele -> sonuc satirlarini
     * DB'den JS ile hesaplanan beklenen kumeyle (hesap no sirasi/kimligi
     * uzerinden) karsilastir.
     */
    async function checkScenario(label, overrides, { pageSize = 20 } = {}) {
      await clickButtonByText(page, "Temizle");
      await new Promise((r) => setTimeout(r, 500));
      if (overrides.dateFrom) await fillDateInputByIndex(page, 0, overrides.dateFrom);
      if (overrides.dateTo) await fillDateInputByIndex(page, 1, overrides.dateTo);
      if (overrides.hesapNo) await fillNthNonDateInput(page, 0, overrides.hesapNo);
      if (overrides.kullaniciAdi) await fillNthNonDateInput(page, 1, overrides.kullaniciAdi);
      if (overrides.notifHeader) await fillNthNonDateInput(page, 2, overrides.notifHeader);
      if (overrides.status) await selectDropdownByIndex(page, 1, overrides.status);
      await clickButtonByText(page, "Listele");
      await new Promise((r) => setTimeout(r, 700));

      const gotten = await getTableRows(page);
      const expected = expectedRows(all, effective(overrides));
      const expectedPage = expected.slice(0, pageSize);
      const gottenHesapNo = gotten.map((c) => c[2]);
      const expectedHesapNo = expectedPage.map((r) => r.hesap_no);
      const screenshot = await page.screenshot();

      const ok = gotten.length === expectedPage.length && gottenHesapNo.every((v, i) => v === expectedHesapNo[i]);
      if (ok) {
        report.pass(label, `${gotten.length} satir (toplam eslesen: ${expected.length})`, { screenshot });
      } else {
        report.fail(
          label,
          `beklenen hesap no'lar [${expectedHesapNo.join(", ")}] (toplam eslesen: ${expected.length}), gelen [${gottenHesapNo.join(", ")}] (${gotten.length} satir)`,
          { screenshot, diagnostics: diagnostics.getLogs() }
        );
      }
      return { gotten, expected };
    }

    // --- Tekil filtreler ---
    await checkScenario("Kullanici Adi='adem' filtresi (partial/contains)", { kullaniciAdi: "adem" });
    await checkScenario("Bildirim Tipi='Tamami' filtresi (partial/contains, 2 farkli header'i kapsar)", { notifHeader: "Tamami" });
    await checkScenario("Durum=SUCCESS filtresi", { status: "SUCCESS" });
    await checkScenario("Durum=FAIL filtresi", { status: "FAIL" });
    await checkScenario("Yatirimci No='100' filtresi (genis partial, tum hesaplari kapsar)", { hesapNo: "100" });
    await checkScenario("Yatirimci No='10004' filtresi (dar/spesifik)", { hesapNo: "10004" });

    // --- Tarih araligi senaryolari ---
    await checkScenario("Tarih: sadece Bitis (dateFrom bos, dateTo=2026-08-01)", { dateTo: "2026-08-01" });
    await checkScenario("Tarih: sadece Baslangic (dateFrom=2026-07-28, dateTo varsayilan=dun)", { dateFrom: "2026-07-28" });
    await checkScenario("Tarih: hem Baslangic hem Bitis (2026-08-01 - 2026-08-03)", { dateFrom: "2026-08-01", dateTo: "2026-08-03" });

    // --- Kombinasyonlar ---
    await checkScenario("Kombinasyon: Tarih araligi + Durum=SUCCESS", { dateFrom: "2026-07-28", dateTo: "2026-08-03", status: "SUCCESS" });
    await checkScenario("Kombinasyon: Kullanici Adi + Bildirim Tipi + Durum (uclu)", {
      kullaniciAdi: "bkaya",
      notifHeader: "Tamami",
      status: "SUCCESS",
    });
    await checkScenario("Kombinasyon: Yatirimci No + Kullanici Adi + Bildirim Tipi + Durum + Tarih (hepsi birden)", {
      hesapNo: "100",
      kullaniciAdi: "ademir",
      notifHeader: "Gerceklesti",
      status: "FAIL",
      dateFrom: "2026-07-01",
      dateTo: yesterdayIso,
    });

    // --- Sifir sonuc durumu ---
    {
      const { gotten } = await checkScenario("Sifir-sonuc: Yatirimci No='99999' (eslesen hesap yok)", { hesapNo: "99999" });
      const emptyMessageVisible = await page.evaluate(() => document.body.innerText.includes("Kayit bulunamadi"));
      if (gotten.length === 0 && emptyMessageVisible) {
        report.pass("Sifir sonucta 'Kayit bulunamadi' mesaji gosteriliyor", null);
      } else {
        report.fail("Sifir sonucta bos-durum mesaji gorunmuyor", `gotten.length=${gotten.length}, mesaj gorunur=${emptyMessageVisible}`, {
          diagnostics: diagnostics.getLogs(),
        });
      }
    }

    // --- Sayfalama + filtre birlikte: Durum=SUCCESS toplam 21 satir (sayfa basi 20 -> 2 sayfa) ---
    {
      const successExpected = expectedRows(all, effective({ status: "SUCCESS" }));
      await checkScenario("Sayfalama+filtre: Durum=SUCCESS sayfa 1 (20 satir bekleniyor)", { status: "SUCCESS" });
      if (successExpected.length > 20) {
        await clickButtonByText(page, "Sonraki");
        await new Promise((r) => setTimeout(r, 700));
        const page2 = await getTableRows(page);
        const expectedPage2 = successExpected.slice(20);
        const gottenHesapNo2 = page2.map((c) => c[2]);
        const expectedHesapNo2 = expectedPage2.map((r) => r.hesap_no);
        const shot = await page.screenshot();
        if (page2.length === expectedPage2.length && gottenHesapNo2.every((v, i) => v === expectedHesapNo2[i])) {
          report.pass("Sayfalama+filtre: Durum=SUCCESS sayfa 2", `${page2.length} satir, hesap no'lar: ${gottenHesapNo2.join(", ")}`, { screenshot: shot });
        } else {
          report.fail(
            "Sayfalama+filtre: Durum=SUCCESS sayfa 2 beklenmedik",
            `beklenen [${expectedHesapNo2.join(", ")}], gelen [${gottenHesapNo2.join(", ")}]`,
            { screenshot: shot, diagnostics: diagnostics.getLogs() }
          );
        }
        await clickButtonByText(page, "Onceki");
        await new Promise((r) => setTimeout(r, 700));
      } else {
        report.info("Durum=SUCCESS sayfalama adimi atlandi", `toplam ${successExpected.length} satir, tek sayfaya sigiyor`);
      }
    }

    // --- Sayfa Basina Satir degisimi (20 -> 50 -> 100 -> 20), filtresiz varsayilan gorunumde ---
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 500));
    const defaultExpected = expectedRows(all, effective({}));
    for (const size of [50, 100, 20]) {
      await selectDropdownByIndex(page, 0, String(size));
      await new Promise((r) => setTimeout(r, 700));
      const pageRows = await getTableRows(page);
      const expectedCount = Math.min(defaultExpected.length, size);
      if (pageRows.length === expectedCount) {
        report.pass(`Sayfa Basina Satir=${size}`, `${pageRows.length} satir (toplam ${defaultExpected.length})`);
      } else {
        report.fail(`Sayfa Basina Satir=${size} yanlis satir sayisi`, `beklenen ${expectedCount}, gelen ${pageRows.length}`, {
          diagnostics: diagnostics.getLogs(),
        });
      }
    }

    // --- Temizle: filtreleri doldur, Temizle'ye bas, formun ve sonucun varsayilana dondugunu dogrula ---
    await fillDateInputByIndex(page, 0, "2026-07-01");
    await fillDateInputByIndex(page, 1, "2026-07-15");
    await fillNthNonDateInput(page, 0, "10004");
    await fillNthNonDateInput(page, 1, "ecelik");
    await fillNthNonDateInput(page, 2, "Tamami");
    await selectDropdownByIndex(page, 1, "FAIL");
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 700));
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 700));
    const formAfterTemizle = await page.evaluate(() => {
      const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
      const textInputs = Array.from(document.querySelectorAll('[data-slot="input"]')).filter((i) => i.getAttribute("type") !== "date");
      const statusSelect = document.querySelectorAll('[data-slot="select-trigger"]')[1];
      return {
        dateFrom: dateInputs[0]?.value ?? null,
        dateTo: dateInputs[1]?.value ?? null,
        hesapNo: textInputs[0]?.value ?? null,
        kullaniciAdi: textInputs[1]?.value ?? null,
        notifHeader: textInputs[2]?.value ?? null,
        statusLabel: statusSelect?.textContent?.trim() ?? null,
      };
    });
    const rowsAfterTemizle = await getTableRows(page);
    // NOT: kapali durumdaki Select tetikleyicisi "Hepsi" (SelectItem'in
    // children'i) yerine ham value string'i "HEPSI"yi gosteriyor - bu
    // base-ui'nin SelectValue'sunun bir davranisi (custom render/children
    // verilmedikce esleseni item'in render edilmis label'ini degil, ham
    // value'yu basiyor), sayfa ilk yuklendiginde de ayni - Temizle'nin
    // kendisiyle ilgisi yok. Kucuk ama gercek bir kozmetik bulgu (bkz.
    // rapordaki ilgili adim); burada asil kontrol edilen sey - filtrenin
    // GERCEKTEN temizlendigi (status=null/"HEPSI" karsiligi secili) -
    // oldugu icin mevcut gercek davranisa gore dogrulaniyor.
    const temizleFormOk =
      formAfterTemizle.dateFrom === "" &&
      formAfterTemizle.dateTo === yesterdayIso &&
      formAfterTemizle.hesapNo === "" &&
      formAfterTemizle.kullaniciAdi === "" &&
      formAfterTemizle.notifHeader === "" &&
      formAfterTemizle.statusLabel.startsWith("HEPSI");
    const temizleCountOk = rowsAfterTemizle.length === Math.min(defaultExpected.length, 20);
    if (temizleFormOk && temizleCountOk) {
      report.pass("Temizle formu ve sonucu varsayilana donduruyor", `form=${JSON.stringify(formAfterTemizle)}, ${rowsAfterTemizle.length} satir`);
    } else {
      report.fail(
        "Temizle beklenen varsayilana donmedi",
        `form=${JSON.stringify(formAfterTemizle)}, satir=${rowsAfterTemizle.length} (beklenen ${Math.min(defaultExpected.length, 20)})`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Detay paneli: ilk satira tikla, sag paneldeki Bildirim Id ile DB'deki event_id eslessin ---
    const firstExpected = defaultExpected[0];
    const firstRowClicked = await page.evaluate(() => {
      const row = document.querySelector("tbody tr");
      if (!row) return false;
      row.click();
      return true;
    });
    await new Promise((r) => setTimeout(r, 500));
    const detailEventId = await page.evaluate(() => {
      const el = document.querySelector("aside .font-mono.text-lg.font-semibold");
      return el ? el.textContent.trim() : null;
    });
    const detailShot = await page.screenshot();
    if (firstRowClicked && detailEventId === String(firstExpected.event_id)) {
      report.pass("Detay paneli secili satirla eslesiyor", `Bildirim Id=${detailEventId}`, { screenshot: detailShot });
    } else {
      report.fail(
        "Detay paneli secili satirla eslesmiyor",
        `beklenen event_id=${firstExpected?.event_id}, gelen=${detailEventId}`,
        { screenshot: detailShot, diagnostics: diagnostics.getLogs() }
      );
    }

    // --- UI regresyon: tablo sag paneli oreatmiyor (yatay tasma yok) ---
    const overflowInfo = await page.evaluate(() => {
      const table = document.querySelector("table");
      const scrollParent = table.closest(".overflow-auto");
      return { clientWidth: scrollParent.clientWidth, scrollWidth: scrollParent.scrollWidth };
    });
    if (overflowInfo.scrollWidth <= overflowInfo.clientWidth + 1) {
      report.pass("Tablo sag paneli ortmuyor (yatay tasma yok)", `clientWidth=${overflowInfo.clientWidth}, scrollWidth=${overflowInfo.scrollWidth}`);
    } else {
      report.fail(
        "Tablo yatay tasma yapiyor (sag panelin arkasina geciyor olabilir)",
        `clientWidth=${overflowInfo.clientWidth}, scrollWidth=${overflowInfo.scrollWidth}`,
        { diagnostics: diagnostics.getLogs() }
      );
    }

    // --- Rapor Olustur (Gecmis Bildirimler, aktif bir filtreyle) ---
    await clickButtonByText(page, "Temizle");
    await new Promise((r) => setTimeout(r, 500));
    await selectDropdownByIndex(page, 1, "FAIL");
    await clickButtonByText(page, "Listele");
    await new Promise((r) => setTimeout(r, 700));
    await clickButtonByText(page, "Rapor Olustur");
    const gecmisToast = await waitForToast(page, 5000);
    const raporShot = await page.screenshot();
    if (gecmisToast === "Rapor olusturuldu.") {
      report.pass("Gecmis Bildirimler'de (Durum=FAIL filtreliyken) Rapor Olustur basarili", gecmisToast, { screenshot: raporShot });
    } else {
      report.fail("Gecmis Bildirimler'de Rapor Olustur basarisiz", `gelen toast: "${gecmisToast}"`, { screenshot: raporShot, diagnostics: diagnostics.getLogs() });
    }

    await page.close();
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
    const crashReport = new ScenarioReport("Bildirim Izleme (React) - Kapsamli Filtre/Sayfalama/UI Testi (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `bildirim-izleme-kapsamli-testi-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
