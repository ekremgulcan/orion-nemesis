---
name: test-automation
description: Use when the user asks to test a screen/function/button in the Orion v3 Nemesis platform end-to-end - e.g. "bu ekranı test edelim", "şu butonu test et", "test otomasyonu yaz/çalıştır", "Teminat İşlemleri'nde yeni transfer testi yap", "database'de güncellendiğini kontrol et", "checklist çıkar ve test et". Covers both the legacy ZK7 screens and the new nemesis-frontend React screens. Builds a checklist from the user's description of what to test, drives the browser with Puppeteer (no download required - reuses the installed Edge binary), verifies the resulting state directly in the MSSQL database via sqlcmd, and cross-checks the change is visible in a related screen (e.g. a request created in one screen appears in an approval screen). Produces a clear PASS/FAIL report back to the user.
---

# Orion Test Automation

Bu proje icin uctan uca (E2E) fonksiyonel test otomasyonu skill'i.
Kullanici bir ekran/buton/fonksiyon soyler, sen bir checklist
cikarirsin, Puppeteer ile tarayiciyi surersin, MSSQL veritabaninda
sorgularla dogrularsin ve kullaniciya net bir PASS/FAIL raporu
sunarsin.

**Kapsam**: Hem eski ZK7 ekranlari (`localhost:8080/**/*.zul`) hem yeni
React ekranlari (`nemesis-frontend`, `localhost:5173/**`) test
edilebilir. Varsayilan olarak once ZK (eski) versiyonda test yapilir
- kullanici aksini belirtmedikce.

**Kalici altyapi**: Tum script'ler ve helper'lar proje kokunde
`test-automation/` klasorunde KALICI olarak saklanir (screenshot
dogrulama pattern'inin aksine, gecici uretilip silinmez). Ayni senaryo
tekrar istendiginde script yeniden yazilmaz, doğrudan calistirilir.
Zaman icinde bu klasor buyuyen bir regresyon suite'i haline gelir.

## Adim 0: Ortami kontrol et

Her cagrida ilk is olarak ortam kontrol scriptini calistir:

```bash
bash ~/.config/opencode/skills/test-automation/scripts/check-environment.sh
```

Bu, Docker MSSQL container'in (`orion-mssql`) healthy oldugunu, ZK
backend'in (`:8080`) ve gerekiyorsa React dev server'in (`:5173`)
ayakta oldugunu dogrular. `[FAIL]` varsa kullaniciya bildir ve/veya
(izin varsa) ilgili bileseni baslat - `orion-screen-migration` skill'inin
"Ortam Durumu" bolumundeki ayni prosedurleri kullan (backend restart,
frontend restart vb.), bu skill onlari tekrarlamaz.

## Adim 1: Kullanicidan senaryoyu anla ve checklist cikar

Kullanicinin verdigi bilgiden şunları netlestir (gerekirse tek bir
konsolide soru sor, `question` tool'unu kullan):

- **Hangi ekran(lar)** test edilecek? (ZK .zul yolu ve/veya React
  route)
- **Hangi buton/fonksiyon/akis** test edilecek? (orn. "yeni transfer
  talebi olustur", "onayla butonuna bas", "silme islemi")
- **Hangi veritabani tablosu/kolonu** degismesi bekleniyor, hangi
  degerle? (orn. `collateral_transfers` tablosunda yeni satir,
  `durum = 'BEKLEMEDE'`)
- **Capraz dogrulama var mi?** (orn. bir ekranda olusturulan kayit
  baska bir ekranda da gorunmeli mi - Teminat Islemleri -> Teminat
  Onay Ekrani gibi)

Bunlardan checklist'i madde madde cikar ve kullaniciya kisa bir ozet
olarak sun (asil raporlama formatinda, agir bicimlendirme yok), sonra
uygulamaya gec - onay bekleme, dogrudan devam et.

## Adim 2: Ilgili ekranin kaynak kodunu oku

Script yazmadan once MUTLAKA ilgili `.zul`/ViewModel (ZK) veya
`.tsx`/api dosyasini (React) oku - form alanlarinin DOM sirasini,
buton metinlerini, basari/hata mesaji formatini ve hangi
tablo/entity'nin etkilendigini kod uzerinden dogrula. Kesif icin
`references/dom-notes.md` dosyasindaki bilinen desenlere bak once;
DOM yapisi orada belgelenmemis yeni bir bilesen turuyle
karsilasirsan, gecici bir Puppeteer script'iyle (bkz. Adim 3'teki
"kesif" notu) canli DOM'u incele, script'i calistir-sil, bulgunu
`references/dom-notes.md`'ye ekle.

## Adim 3: Script'i yaz (veya varsa mevcut olani kullan)

Once `test-automation/screens/zk/` ve `test-automation/screens/react/`
altinda ayni senaryoyu kapsayan bir script olup olmadigina bak (dosya
adi ekran+eylem temelli, orn. `teminat-transfer-olusturma.cjs`). Varsa
onu **DUZENLEME, DOGRUDAN CALISTIR** (Adim 4). Yoksa yeni bir script
yaz:

- Konum: `test-automation/screens/zk/<ekran-eylem>.cjs` veya
  `test-automation/screens/react/<ekran-eylem>.cjs`
- Her zaman şu helper'lari kullan (yeniden yazma):
  - `helpers/browser.js` - `launchBrowser()`, `newPage()`
  - `helpers/zk.js` (ZK ekranlari icin) veya `helpers/react.js` (React
    ekranlari icin) - buton tiklama, form doldurma, grid/tablo
    okuma, mesaj/toast bekleme
  - `helpers/db.js` - `runQuery()`, `findLatest()`, `deleteById()`
  - `helpers/report.js` - `ScenarioReport` (PASS/FAIL/SQL adim
    raporlama + HTML/PDF rapor uretimi, bkz. asagidaki "Screenshot ve
    HTML/PDF rapor" bolumu)
  - `helpers/diagnostics.js` - `attachPageDiagnostics()` +
    `suggestFix()` (basarisizlik teshisi + cozum onerisi, bkz.
    asagidaki "Basarisizlik teshisi ve cozum onerisi" bolumu)
- **ALTIN KURAL: hicbir DOM id'sine guvenme** - hem ZK hem React'te
  id'ler her sayfa yuklemesinde degisir (kanitlanmis, bkz.
  `references/dom-notes.md`). Sadece gorunur metin, DOM sirasi veya
  kararli data-attribute (`data-slot`, `data-sonner-toast`,
  `role="dialog"`) ile sec.
- Her senaryo scripti şu yapiyi izlemeli (bkz. mevcut ornekler):
  1. Tarayiciyi ac, ilgili sayfaya git
  2. Formu doldur / butona bas (ZK icin `zk.js`, React icin
     `react.js` helper'lariyla)
  3. Basari mesaji/toast'ini dogrula
  4. `db.js` ile veritabaninda beklenen satiri/degeri sorgula, dogrula
  5. (Varsa) capraz ekranda gorunurlugu dogrula (`findGridRow` /
     `findTableRow`)
  6. `finally` bloğunda tarayiciyi kapat
  7. **Test verisini benzersiz yap** (orn. aciklama alanina
     `Date.now()` ekle) ki ardisik calistirmalar birbirine karismasin
  8. **Teardown**: olusturulan test kaydini `db.js#deleteById` ile sil
     - kalici suite'i kirletme, seed veriye asla toplu DELETE atma
- `ScenarioReport` ile her adimi `pass`/`fail`/`info` olarak isaretle,
  sonunda `summary()` cagirip exit code'u ona gore ayarla (0=basarili,
  1=basarisiz) - boylece script hem insan hem otomasyon tarafindan
  okunabilir sonuc verir.

### Screenshot ve HTML/PDF rapor

Her yeni senaryo scripti, kritik adimlarda ekran goruntusu yakalamali
ve calisma sonunda bir HTML raporu uretmelidir (kanitlanmis referans
script'lerdeki gibi):

- Kritik adimlarda (form dolduruldugunda, basari mesaji/toast
  gorundugunde, capraz ekranda kayit bulundugunda) `page.screenshot()`
  ile bir Buffer al ve `report.pass(step, detail, { screenshot })` /
  `report.fail(step, detail, { screenshot })` ile ilgili adima ekle -
  screenshot dosyaya yazilmaz, dogrudan Buffer olarak tasinir ve rapor
  uretilirken base64 olarak HTML'e gomulur (ekstra .png dosyasi
  kalmaz).
- DB sorgusu calistirdiginda `report.pass()` yerine
  `report.sql(step, query, rows)` kullan - bu, raporda sorgu metnini
  ve sonuc satirlarini ayri, terminal-stilinde bir SQL blogu olarak
  gosterir.
- Script sonunda (teardown'dan once, `summary()` sonrasi) su cagriyi
  ekle:

```js
const reportPath = await report.writeHtmlReport(
  path.join(__dirname, "..", "..", "reports", `<senaryo-adi>-${Date.now()}.html`)
);
console.log(`\nHTML raporu olusturuldu: ${reportPath}`);
```

- Kullanici PDF isterse, aynı sekilde `report.writePdfReport(outputPath)`
  cagrilabilir (ayni HTML'i headless Edge ile PDF'e basar, ekstra
  bagimlilik gerektirmez - projede LaTeX/pandoc/wkhtmltopdf kurulu
  degil, bu yuzden bu yontem tercih edilir).
- Uretilen raporlar `test-automation/reports/` altina yazilir. Bu
  klasor `.gitignore`'dadir (git'e commitlenmez - embed edilmis
  base64 screenshot'lar yuzunden dosyalar birkac MB olabilir, repo'yu
  sisirmemek icin git disi tutulur) ama **diskte KALICI olarak
  BIRIKIR** - her calistirma kendi zaman damgali dosyasini ekler,
  eskiler SILINMEZ. **ONEMLI: `reports/` klasorunu veya icindeki
  herhangi bir dosyayi asla silme** (ne `rm -rf reports/*` ne de tekil
  dosya silme) - bu klasor projenin calisan bir gecmis/audit-log'udur,
  kullanici gecmis bir calistirmanin raporuna tekrar bakmak isteyebilir.
  Script'in kendisi kalici, her calistirmanin raporu da kaliciir - tek
  gecici olan, ayni script'i tekrar tekrar calistirirken biriken CRASH
  raporlari degil, hicbiri otomatik silinmez. Dosya adlandirma her
  zaman `<senaryo-adi>-<Date.now()>.html` (basarili) veya
  `<senaryo-adi>-crash-<Date.now()>.html` (crash) formatinda olmali -
  boylece ayni senaryonun farkli calistirmalari zaman sirasina gore
  ayirt edilebilir ve birbirinin ustune yazilmaz.

### Basarisizlik teshisi ve cozum onerisi

Her yeni senaryo scripti, "nerede patladi, neden, olasi cozum ne"
sorularina otomatik yanit uretmelidir - kullanicinin rapor icinde bunu
manuel arastirmasina gerek kalmamali:

- Sayfa acildiktan hemen sonra (`newPage()` cagrisinin ardindan) su
  cagriyi ekle:

```js
const diagnostics = attachPageDiagnostics(page);
```

  Bu, script boyunca tarayici konsol hatalarini, yakalanmamis JS
  exception'larini ve 4xx/5xx HTTP yanitlarini/basarisiz network
  isteklerini pasif olarak biriktirir - ekstra kod gerektirmez.
- Her `report.fail(step, detail, extra)` cagrisina
  `diagnostics: diagnostics.getLogs()` ekle:

```js
report.fail("Basari mesaji goruntenmedi", "...", {
  screenshot: someScreenshot,
  diagnostics: diagnostics.getLogs(),
});
```

  `ScenarioReport.fail()` bu bilgiyi otomatik olarak `suggestFix()`'e
  gecirip bir Turkce cozum onerisi uretir (extra.suggestion elle
  verilmisse onu kullanir, gerek yok).
- Script'in en disindaki `run().catch(...)` bloğunu, beklenmeyen bir
  exception oldugunda da ayri bir "CRASH" HTML raporu ureten sekle
  getir (mevcut referans scriptlerdeki gibi):

```js
run().catch(async (err) => {
  console.error("Senaryo beklenmeyen hata ile sonlandi:", err);
  try {
    const crashReport = new ScenarioReport("<Senaryo Adi> (CRASH)");
    crashReport.crash("Script beklenmeyen hata ile sonlandi", err);
    crashReport.summary();
    const p = await crashReport.writeHtmlReport(
      path.join(__dirname, "..", "..", "reports", `<senaryo-adi>-crash-${Date.now()}.html`)
    );
    console.log(`\nCrash raporu olusturuldu: ${p}`);
  } catch (reportErr) {
    console.error("Crash raporu da olusturulamadi:", reportErr);
  }
  process.exit(1);
});
```

  `crash()` her zaman (diagnostics olsun olmasin) hata mesajindan bir
  oneri uretir - boylece script beklenmedik sekilde patlasa bile bos
  bir stack trace yerine anlamli bir rapor kalir.
- Uretilen HTML raporunda basarisiz her adim icin kirmizi bir "Neden
  basarisiz oldu? / Potansiyel cozum" kutusu gorunur (oneri metni +
  varsa yakalanan konsol/network hatalari), ayrica raporun en ustunde
  "Nerede patladi?" ozeti tum basarisiz adimlari tek bakista listeler.
- `suggestFix()` bilinen kaliplari (helper'larin firlattigi hata
  mesajlari, 401/403/404/5xx HTTP durumlari, yakalanmamis JS hatalari)
  tanir ve kisa, somut bir sonraki adim onerir; hicbiri eslesmezse
  genel bir "ekran goruntusunu ve SQL sonucunu karsilastirarak asamali
  incele" onerisine duser. **Bu oneri bir baslangic noktasidir, kesin
  teshis degildir** - Adim 5'teki "gercek bug mu, script hatasi mi"
  ayrimini yaparken hala kendi degerlendirmeni kullan, oneriyi
  kullaniciya sanki kesin dogruymus gibi sunma; "otomatik analiz sunu
  onerdi, ekran goruntusune bakinca gordugum..." seklinde aktar.

## Adim 4: Script'i calistir

```bash
cd test-automation
MSYS_NO_PATHCONV=1 node screens/zk/<senaryo>.cjs
# veya React icin:
MSYS_NO_PATHCONV=1 node screens/react/<senaryo>.cjs
```

`MSYS_NO_PATHCONV=1` Windows/Git Bash'te `docker exec` argumanlarinin
yanlislikla path'e cevrilmesini engeller (db.js sorgularinda gerekli).

Ilk calistirmada bagimliliklar kurulu degilse:

```bash
cd test-automation && npm install
```

## Adim 5: Sonuclari kullaniciya raporla

Script ciktisindaki `[PASS]`/`[FAIL]` adimlarini ve final `summary()`
satirini oku, kullaniciya asagidaki gibi ozetle (agir bicimlendirme
kullanma, dogrudan sonuclari anlat):

- Hangi adimlar basarili oldu (kisa, somut detaylarla - orn. "transfer_id=20007
  ile BEKLEMEDE durumunda kayit olustu")
- Hangi adim(lar) basarisiz oldu, neden (script cikitisindaki `[FAIL]`
  detayini birebir aktar)
- Capraz ekran dogrulamasi yapildiysa sonucunu ayrica belirt
- Test kaydinin temizlendigini belirt (kalici veriye dokunulmadigini
  teyit et)
- Uretilen HTML rapor dosyasinin tam yolunu kullaniciya bildir (script
  ciktisindaki "HTML raporu olusturuldu:" satirindan al) - kullanici
  isterse PDF de uretilebilecegini belirt

Basarisizlik durumunda kullaniciya "bu bir gercek bug mu yoksa test
script'inin DOM secici hatasi mi" ayrimini yapmaya calis - script
hatasiysa (orn. yanlis input index'i) once script'i duzelt ve tekrar
calistir, gercek bir uygulama hatasiysa aciqla ve kullaniciya bildir,
kodu senin izinsiz "duzeltmeye" calisma (bu bir test skill'i, bug-fix
skill'i degil - kullanici ayrica duzeltme isterse yap). HTML rapordaki
otomatik "Neden basarisiz oldu? / Potansiyel cozum" onerisini bu
ayrimi hizlandirmak icin kullan (bkz. yukaridaki "Basarisizlik teshisi
ve cozum onerisi" bolumu), ama oneriyi oldugu gibi kopyalama - ekran
goruntusu/diagnostics ile teyit edip kendi cumlenle ozetle.

## Referans senaryolar (kanitlanmis, calisan ornekler)

Asagidaki script'ler tam olarak calistirilip dogrulanmis "altin
standart" orneklerdir - yeni bir senaryo yazarken bunlarin yapisini
birebir takip et:

- `test-automation/screens/zk/teminat-transfer-olusturma.cjs` - ZK
  Teminat Islemleri ekraninda yeni transfer talebi olusturma + DB
  dogrulama + Teminat Onay Ekrani'nda capraz dogrulama (ayri onay
  ekrani olan cift-ekran ornegi)
- `test-automation/screens/react/teminat-islemleri-yeni-transfer.cjs`
  - Ayni senaryonun React (nemesis-frontend) karsiligi
- `test-automation/screens/zk/nakit-islem-giris-yeni-talep.cjs` - ZK
  Nakit Islem Giris ekraninda yeni nakit islem talebi olusturma + DB
  dogrulama + ayni ekrandaki "Islem Gecmisi" listesinde dogrulama (tek
  ekran icinde self-service onay/red barindiran, ayri onay ekrani
  OLMAYAN ornek - bu durumda capraz dogrulama sayfa yenilenip ayni
  listede kaydin gorunmesi seklinde yapilir)
- `test-automation/screens/react/nakit-islem-giris-yeni-talep.cjs` -
  Ayni senaryonun React karsiligi (dikkat: bu tabloda tutar 2 ondalikli
  formatlaniyor - "2500.00"/"2.500,00" - Teminat ekranindaki 4
  ondalikli "1500.0000" formatindan farkli, her yeni tabloda gercek DB
  kolon tipini/ZK grid render'ini once kontrol et, varsayima dayanma)

## Yeni bir ekran/senaryo test edilecekse

1. Once `references/dom-notes.md`'yi oku (bilinen desenler, tuzaklar)
2. Yukaridaki iki referans script'i oku (yapiyi anlamak icin)
3. Test edilecek ekranin `.zul`/ViewModel veya `.tsx`/api dosyasini oku
4. Gerekirse kisa bir kesif script'i yaz (ayni `helpers/browser.js` ile),
   sadece konsola `console.log` ile DOM bilgisi bas, CALISTIR, sonucu
   incele, SIL (bu proje boyunca kullanilan "screenshot pattern"i ile
   ayni ruh - gecici script kalici suite'e KARISMAMALI)
5. Bulgu yeniyse `references/dom-notes.md`'yi guncelle
6. Kalici senaryo script'ini `test-automation/screens/<zk|react>/`
   altina yaz, calistir, PASS oldugunu dogrula, teardown'in temiz
   calistigini kontrol et (DB'de kalinti kalmamali)
7. Kullaniciya raporla
