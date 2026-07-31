/**
 * Automatic failure diagnostics for scenario scripts. Two pieces:
 *
 * 1. attachPageDiagnostics(page) - passively records browser console
 *    errors, uncaught page exceptions, and failed/4xx-5xx HTTP
 *    responses as they happen, with zero per-step instrumentation
 *    needed. Call this once right after newPage() and pass
 *    diagnostics.getLogs() into report.fail()/report.crash() so the
 *    report can explain WHY a step failed, not just THAT it failed.
 *
 * 2. suggestFix(...) - a small heuristic engine that matches common,
 *    previously-seen failure signatures (from this project's helper
 *    error messages and typical backend error shapes) against the
 *    error text + captured diagnostics, and returns a short, actionable
 *    Turkish suggestion. This is a heuristic aid for the agent's
 *    judgment, not a replacement for actually reading the failure -
 *    it exists to save the first round of investigation, not the last.
 */

function attachPageDiagnostics(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err) => {
    pageErrors.push(err.message || String(err));
  };
  const onResponse = (response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push(`${status} ${response.request().method()} ${response.url()}`);
    }
  };
  const onRequestFailed = (request) => {
    const failure = request.failure();
    networkErrors.push(`FAILED ${request.method()} ${request.url()} (${failure?.errorText ?? "bilinmeyen hata"})`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  return {
    /** Returns everything captured so far, as plain arrays (does not clear). */
    getLogs() {
      return {
        consoleErrors: [...consoleErrors],
        pageErrors: [...pageErrors],
        networkErrors: [...networkErrors],
      };
    },
    /** Clears accumulated logs - call between major steps if you only want diagnostics since the last checkpoint. */
    clear() {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      networkErrors.length = 0;
    },
    /** Detaches all listeners - optional, page.close()/browser.close() cleans these up anyway. */
    dispose() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
    },
  };
}

/**
 * Returns a short Turkish suggestion string given the failing error
 * message and/or captured diagnostics. Checks known patterns in order
 * of specificity (helper-thrown errors first, then network/JS errors),
 * falls back to a generic investigation checklist if nothing matches.
 */
function suggestFix({ errorMessage = "", diagnostics = {} } = {}) {
  const { consoleErrors = [], pageErrors = [], networkErrors = [] } = diagnostics;
  const suggestions = [];

  if (/no button found with text/i.test(errorMessage)) {
    suggestions.push(
      "Script'teki buton metni ekrandaki gercek metinle birebir eslesmiyor olabilir (bosluk/harf/etiket " +
        "degisikligi) ya da buton su an disabled/gizli durumda - genellikle bir onceki adim (form doldurma, " +
        "dialog acma) sessizce basarisiz oldugu icin butona hic ulasilamamistir. Once bu adimin ekran " +
        "goruntusune bak, buton o an gercekten sayfada goruntuleniyor mu kontrol et."
    );
  }
  if (/expected at least \d+ inputs?/i.test(errorMessage)) {
    suggestions.push(
      "Beklenen input sayisi sayfadaki gercek input sayisiyla uyusmuyor - form alanlari degismis " +
        "(yeni alan eklenmis/kaldirilmis) ya da (React ise) dialog scope'u yanlis oldugu icin arka " +
        "plandaki sayfanin kendi input'lari da sayilmis olabilir. Ilgili .tsx/.zul dosyasini tekrar " +
        "okuyup guncel DOM sirasini dogrula."
    );
  }
  if (/option .* not found in (combobox|select)/i.test(errorMessage)) {
    suggestions.push(
      "Aranan secenek metni combobox/select icinde bulunamadi - secenek listesi degismis olabilir " +
        "(yeni deger eklenmis, isim degismis) ya da liste secim yapilmadan once henuz acilip render " +
        "olmamisti (timing sorunu). Bekleme suresini artirmayi veya kaynak dosyadaki secenek listesini " +
        "tekrar kontrol etmeyi dene."
    );
  }
  if (/db\.runQuery failed/i.test(errorMessage)) {
    suggestions.push(
      "Veritabani sorgusu calistirilamadi - orion-mssql container'i su an ayakta olmayabilir " +
        "(docker ps ile kontrol et) ya da sorgu metninde bir sozdizimi hatasi olabilir (ozellikle " +
        "aciklama/string alanlarinda tek tirnak kacisi eksikse)."
    );
  }

  const authErrors = networkErrors.filter((e) => /^40[13]\b/.test(e));
  if (authErrors.length > 0) {
    suggestions.push(
      `Yetkilendirme hatasi tespit edildi (${authErrors[0]}) - oturum/token suresi dolmus olabilir ` +
        "ya da bu islem icin gereken rol/izin eksik. Backend'de ilgili endpoint'in guvenlik/rol " +
        "yapilandirmasini kontrol et."
    );
  }
  const notFoundErrors = networkErrors.filter((e) => /^404\b/.test(e));
  if (notFoundErrors.length > 0) {
    suggestions.push(
      `404 (bulunamadi) hatasi tespit edildi (${notFoundErrors[0]}) - cagrilan API/endpoint yolu ` +
        "yanlis olabilir ya da backend'de bu route kaldirilmis/degismis. Controller'daki path ile " +
        "frontend api modulundeki (src/api/*.ts) URL'yi karsilastir."
    );
  }
  const serverErrors = networkErrors.filter((e) => /^5\d\d\b/.test(e));
  if (serverErrors.length > 0) {
    suggestions.push(
      `Sunucu hatasi tespit edildi (${serverErrors[0]}) - bu buyuk ihtimalle gercek bir backend/uygulama ` +
        "hatasi, script'in kendi hatasi degil. Backend loglarini (orion-runN.log) kontrol et, ilgili " +
        "Service/Controller'da bir exception firlatilmis olabilir."
    );
  }
  if (pageErrors.length > 0 && suggestions.length === 0) {
    suggestions.push(
      `Sayfada yakalanmamis bir JavaScript hatasi olustu: "${pageErrors[0]}". Bu genellikle React ` +
        "tarafinda beklenmeyen bir veri sekli (orn. API'den null donen bir alan) yuzunden olusur - " +
        "ilgili .tsx bileseninin bu alani nasil kullandigina bak."
    );
  }
  if (suggestions.length === 0 && consoleErrors.length > 0) {
    suggestions.push(
      `Tarayici konsolunda hata(lar) yakalandi (ilk: "${consoleErrors[0]}"). Bu, adimin neden ` +
        "basarisiz oldugunu aciklayan ek bir ipucu olabilir, asagidaki Teknik Detaylar bolumune bak."
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Otomatik bir esleme bulunamadi - bu ya gercek bir is kurali/dogrulama farkliligi (orn. beklenen " +
        "mesaj metni degismis) ya da script'teki bir varsayimin (DOM sirasi, varsayilan deger, sayi " +
        "formati) artik gecerli olmamasi olabilir. Ekran goruntusunu ve (varsa) SQL sonucunu " +
        "karsilastirarak gercek durumu asamali olarak incele."
    );
  }

  return suggestions.join(" ");
}

module.exports = { attachPageDiagnostics, suggestFix };
