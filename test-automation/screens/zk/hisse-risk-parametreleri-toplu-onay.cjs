const path = require("node:path");
const fs = require("node:fs");
const xlsx = require("xlsx");
const { launchBrowser, newPage } = require("../../helpers/browser");
const { clickButtonByText, findGridRow, clickMessageboxButton, waitForMessagebox } = require("../../helpers/zk");
const { runQuery, deleteById } = require("../../helpers/db");
const { ScenarioReport } = require("../../helpers/report");
const { attachPageDiagnostics } = require("../../helpers/diagnostics");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const REPORT_PATH = path.join(__dirname, "..", "..", "reports", `hisse-risk-parametreleri-toplu-onay-${Date.now()}.html`);

// Test verisi - Hesap numarası olarak veritabanında varolan rastgele veya test için bir hesap (örn. 10001)
const TEST_HESAP = "10001";
const ESKI_CARPAN = 5;
const YENI_CARPAN = Math.floor(Math.random() * 4) + 1; // 1 ile 4 arası rastgele yeni değer

async function createTestExcel() {
  const tmpDir = path.join(__dirname, "..", "..", "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, `test-upload-${Date.now()}.xlsx`);
  
  const wsData = [
    ["Hesap No", "Net Varlık Limit Çarpanı"],
    [TEST_HESAP, YENI_CARPAN]
  ];
  
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wb, ws, "Sablon");
  xlsx.writeFile(wb, filePath);
  
  return filePath;
}

async function run() {
  const report = new ScenarioReport("Hisse Risk Parametreleri - Toplu Güncelleme ve Onay");
  let browser;
  let excelPath = null;
  let processId = null;

  try {
    // Test öncesi temizlik - Önceki yarım kalan onay süreçlerini silelim (Sadece Hisse Risk Parametreleri surecleri)
    console.log("Test oncesi temizlik yapiliyor...");
    await runQuery(`UPDATE hisse_risk_parametreleri SET net_varlik_limit_carpani = ${ESKI_CARPAN} WHERE account_id = (SELECT account_id FROM accounts WHERE hesap_no = '${TEST_HESAP}')`);
    await runQuery(`DELETE FROM hisse_risk_parametreleri_talepleri`);
    await runQuery(`DELETE FROM workflow_tasks WHERE process_id IN (SELECT process_id FROM workflow_processes WHERE surec_tipi = 'HISSE_RISK_PARAMETRELERI_ONAY')`);
    await runQuery(`DELETE FROM workflow_processes WHERE surec_tipi = 'HISSE_RISK_PARAMETRELERI_ONAY'`);
    
    excelPath = await createTestExcel();
    
    browser = await launchBrowser();
    const page = await newPage(browser);
    const diagnostics = attachPageDiagnostics(page);

    // --- Adim 1: Ekranı Aç ---
    await page.goto(`${BASE_URL}/risk/hisse-risk-parametreleri.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    report.pass("Hisse Risk Parametreleri ekrani acildi", `${BASE_URL}/risk/hisse-risk-parametreleri.zul`);

    // Tab geçişi: Net Varlik Limit Carpani Toplu Guncelleme
    const tabs = await page.$$('.z-tab');
    for (const t of tabs) {
      const text = await page.evaluate(el => el.textContent.trim(), t);
      if (text.includes("Toplu Guncelleme")) {
        await page.evaluate(el => el.click(), t);
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    // --- Adim 2: Excel Yükle ---
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(excelPath);
    } else {
      throw new Error("Dosya yükleme input'u (input[type='file']) bulunamadı.");
    }
    await new Promise((r) => setTimeout(r, 1500));
    
    const onizlemeScreenshot = await page.screenshot();
    report.pass("Excel dosyası yüklendi", `Hesap: ${TEST_HESAP}, Yeni Çarpan: ${YENI_CARPAN}`, { screenshot: onizlemeScreenshot });

    // --- Adim 3: Onaya Gönder ---
    await clickButtonByText(page, "Onaya Gonder");
    
    const msg1 = await waitForMessagebox(page, 3000);
    const successScreenshot = await page.screenshot();
    if (msg1 && msg1.includes("Onaya gonderilmistir")) {
      report.pass("Onaya gönderme basarili", "Onaya gonderilmistir mesaji alindi", { screenshot: successScreenshot });
      await clickMessageboxButton(page, "OK");
    } else {
      report.fail("Onaya gönderme hatasi", "Sayfada 'Onaya gonderilmistir' metni bulunamadi (Gelen: " + msg1 + ")", { screenshot: successScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 4: Veritabanı (1) - Talep Kontrolü ---
    const dbQuery = `SELECT TOP 1 talep_id, onceki_deger_json, yeni_deger_json, durum, account_id FROM hisse_risk_parametreleri_talepleri ORDER BY talep_id DESC;`;
    const rows = await runQuery(dbQuery);
    report.sql("Talebin veritabaninda olusmasi kontrol edildi", dbQuery, rows);
    
    if (rows.length === 1 && rows[0].durum === "BEKLEMEDE" && rows[0].yeni_deger_json.includes(`"netVarlikLimitCarpani":${YENI_CARPAN}`)) {
      processId = rows[0].talep_id; // Sadece test temizliği için gerekli
      report.pass("Veritabaninda yeni talep BEKLEMEDE", `Talep id: ${rows[0].talep_id}`);
    } else {
      report.fail("Talep veritabaninda beklenen sekilde bulunamadi", JSON.stringify(rows));
    }

    // Gerçek Görev Listesinden Süreç ID alalım (workflow_tasks)
    const taskQuery = `SELECT TOP 1 task_id, islem_tipi FROM workflow_tasks WHERE status = 'ACIK' ORDER BY task_id DESC`;
    const taskRows = await runQuery(taskQuery);
    let wfTaskId = null;
    if (taskRows.length > 0) {
       wfTaskId = taskRows[0].task_id;
       // Test için görevi aktif kullanıcıya (ademir) atayalım, böylece görev listesinde görebilelim
       await runQuery(`UPDATE workflow_tasks SET sahip_id = (SELECT id FROM [user] WHERE kullanici_adi = 'ademir') WHERE process_id = (SELECT process_id FROM workflow_tasks WHERE task_id = ${wfTaskId})`);
    }

    // Bug workaround: İnceleme sekmesi açıldığında eski "Hisse Risk Parametreleri" sekmesi açık kalırsa ID çakışması veya sayfa yükleme hatası oluşabiliyor.
    // Bu yüzden eski sekmeyi kapatıyoruz.
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.z-tab'));
        for (const tab of tabs) {
            if (tab.textContent.includes('Hisse Risk Parametreleri')) {
                const closeBtn = tab.querySelector('.z-tab-close');
                if (closeBtn) closeBtn.click();
            }
        }
    });
    await new Promise(r => setTimeout(r, 500));

    // --- Adim 5: Ana Sayfa ve Süreci Onaylama ---
    await page.goto(`${BASE_URL}/index.zul`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    
    // Görev listesinden ilgili süreci bul ve tıkla
    const matchedRow = await findGridRow(page, ["Net Varlik Limit Carpani Toplu Guncelleme Onay Islemi"]);
    if (matchedRow) {
      report.pass("Görev listesinde onay bekleyen süreç bulundu", matchedRow.join(" | "));
      // Satırı tıklayalım
      const rowEls = await page.$$('.z-row, .z-listitem');
      for (const r of rowEls) {
        const txt = await page.evaluate(el => el.textContent, r);
        if (txt.includes("Net Varlik Limit Carpani Toplu Guncelleme")) {
          await page.evaluate(el => el.click(), r);
          break;
        }
      }
    } else {
      report.fail("Görev listesinde süreç bulunamadı", "", { screenshot: await page.screenshot() });
    }

    await new Promise((r) => setTimeout(r, 1500));
    
    // Süreç tıklandığında popup açılır ("Degistirilen Alanlar")
    const popupText = await page.evaluate(() => document.body.innerText);
    console.log("PAGE TEXT AFTER CLICKING TASK:\n", popupText);
    const popupScreenshot = await page.screenshot();
    if (popupText.includes("Degistirilen Alanlar") && popupText.includes(String(YENI_CARPAN))) {
       report.pass("Değişiklik onizleme popup'ı açıldı", `Yeni Çarpan ${YENI_CARPAN} görüldü`, { screenshot: popupScreenshot });
       // Kapatmak için X butonunu bul
       await page.evaluate(() => {
           const closes = Array.from(document.querySelectorAll('.z-window-close'));
           closes.forEach(c => c.click());
       });
       await new Promise((r) => setTimeout(r, 800));
    }
    
    // Şimdi Onayla'ya basalım
    await clickButtonByText(page, "Onayla");
    
    const msg2 = await waitForMessagebox(page, 3000);
    const confirmScreenshot = await page.screenshot();
    if (msg2 && msg2.includes("Onay islemi tamamlandi")) {
       report.pass("Onaylama basarili", "Onay islemi tamamlandi mesaji alindi", { screenshot: confirmScreenshot });
       await clickMessageboxButton(page, "OK");
       await new Promise((r) => setTimeout(r, 1000));
    } else {
       report.fail("Onaylama hatasi", "Onay islemi tamamlandi metni bulunamadi (Gelen: " + msg2 + ")", { screenshot: confirmScreenshot, diagnostics: diagnostics.getLogs() });
    }

    // --- Adim 6: Veritabanı (2) - Güncelleme Kontrolü ---
    const checkTalepler = await runQuery(`SELECT TOP 1 durum FROM hisse_risk_parametreleri_talepleri ORDER BY talep_id DESC;`);
    const checkParams = await runQuery(`SELECT TOP 1 net_varlik_limit_carpani FROM hisse_risk_parametreleri WHERE account_id = (SELECT account_id FROM accounts WHERE hesap_no = '${TEST_HESAP}');`);
    
    report.sql("Onay sonrasi DB kontrol", "...", [...checkTalepler, ...checkParams]);
    
    // Güvenli değer okuma (büyük/küçük harf bağımsız)
    const row = checkParams[0] || {};
    const keys = Object.keys(row);
    const paramKey = keys.find(k => k.toLowerCase() === 'net_varlik_limit_carpani');
    const paramValStr = paramKey ? row[paramKey] : undefined;
    const paramVal = paramValStr ? parseInt(paramValStr, 10) : undefined;
    
    if (checkTalepler[0]?.durum === "ONAYLANDI" && paramVal === YENI_CARPAN) {
       report.pass("Degisiklikler veritabanina basariyla yansidi", `Talep ONAYLANDI, Çarpan ${YENI_CARPAN} oldu`);
    } else {
       report.fail("Veritabani yansimasi basarisiz", `Talep durumu: ${checkTalepler[0]?.durum}, Param (ham keys: ${JSON.stringify(keys)}): ${paramValStr}`);
    }

  } finally {
    if (browser) await browser.close();
    if (excelPath && fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
  }

  const result = report.summary();
  const reportPath = await report.writeHtmlReport(REPORT_PATH);
  console.log(`\nHTML raporu olusturuldu: ${reportPath}`);

  // Clean-up
  if (processId) {
      console.log(`\nTemizlik yapiliyor...`);
      // Update parameter back to 5 so we don't break subsequent tests
      await runQuery(`UPDATE hisse_risk_parametreleri SET net_varlik_limit_carpani = ${ESKI_CARPAN} WHERE account_id = (SELECT account_id FROM accounts WHERE hesap_no = '${TEST_HESAP}')`);
      // Delete request
      await runQuery(`DELETE FROM hisse_risk_parametreleri_talepleri WHERE yeni_deger_json LIKE '%"netVarlikLimitCarpani":${YENI_CARPAN}%'`);
      console.log("Temizlik tamamlandi.");
  }

  process.exit(result.ok ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("Hisse Risk Parametreleri - Toplu Güncelleme (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `hisse-risk-parametreleri-toplu-onay-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
