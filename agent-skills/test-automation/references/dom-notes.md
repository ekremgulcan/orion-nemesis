# Orion DOM Notlari - ZK7 ve React (nemesis-frontend)

Bu dosya, `helpers/zk.js` ve `helpers/react.js` yazılırken yapılan
gerçek DOM keşiflerinin bulgularıdır. Yeni bir senaryo yazmadan önce
oku; yeni bir DOM deseniyle karşılaşırsan (örn. yeni bir shadcn
bileşeni, yeni bir ZK widget tipi) bu dosyayı güncelle.

## Altın kural: hiçbir id'ye güvenme

Her iki teknolojide de doğrulandı:

- **ZK7**: Her sayfa reload'unda TÜM widget id'leri değişir (örn.
  `iF9Pc` bir yüklemede, `hGAPc` bir sonrakinde - aynı textbox).
  ZK'nin kendi otomatik ürettiği id şeması buna izin vermiyor. ZUL
  dosyasında `id="..."` özniteliği yoksa (ki bu projede hiçbir zaman
  yok), id'ye asla güvenme.
- **React (base-ui/shadcn)**: base-ui bazı bileşenlere (`Select`,
  `RadioGroup` vb.) `base-ui-_r_0_` gibi render-sırasına bağlı id'ler
  üretir - bunlar da sayfa yeniden yüklendiğinde/farklı sırayla
  render edildiğinde değişebilir. Çoğu düz `<button>` hiç id almaz.

Bu yüzden HER selector şu üç stratejiden birini kullanmalı:
1. **Görünür metin** (buton/link/tab text'i) - en güvenilir
2. **DOM sırası** (bir konteyner içindeki N'inci input/select) - forma
   özgü, form yapısı değişirse kırılır ama proje boyunca stabil kaldı
3. **Kararlı data-attribute** (örn. `[data-slot="input"]`,
   `[data-sonner-toast]`, `[role="dialog"]`) - shadcn/base-ui/sonner
   bunları render'in bir parçası olarak garanti eder, id gibi rastgele
   değildir

## ZK7 ozel notlari

- Grid/form satırları `<tr>` olarak render edilir; label bir
  `<label>` DEĞİL, `<span>` içinde düz metin olarak gelir - bu yüzden
  "label text -> yanındaki input" eşleştirmesi `label` seçiciyle
  ÇALIŞMAZ. Bunun yerine DOM sırasına güven (bkz.
  `zk.js#fillTextboxesInOrder`).
- Düz metin/decimal alanlar: `input.z-textbox`, `input.z-decimalbox`
- Combobox: görünen input `input.z-combobox-input`; açılan liste öğesi
  `.z-comboitem` (metin `.z-comboitem-text` içinde ama `.z-comboitem`
  üzerinden textContent almak yeterli)
- Buton: hem native `<button>` hem `.z-button` classlı elemanlar olası
  - ikisini birden sorgula (`button, .z-button`)
- **Grid satırları iki farklı class kullanabilir**: düz
  `<grid>`/`<listbox>` `.z-row` kullanır, ama bir `<tabbox>` /
  `<tabpanel>` içine gömülü `<listbox>` (örn. Teminat Onay Ekranı'nın
  5 sekmesi) `.z-listitem` kullanır. `getGridRows` ikisini birden
  sorgular; yeni bir ekranda hiç satır bulunamıyorsa önce
  `document.querySelectorAll("tr").length` ve class isimlerini debug
  et.
- Her tabloda/listbox'ta HER sütun görünmeyebilir - örn. Teminat Onay
  Ekranı'nın "Transfer Talepleri" sekmesi `aciklama` sütununu hiç
  göstermez (bkz. `teminat-onay.zul`). Bir kaydı ararken en özgün ama
  HER sekmede/tabda görünen alanları kullan (hesapNo + miktar + durum
  üçlüsü genelde güvenli), salt free-text alanlara (aciklama gibi)
  güvenme.
- Formu doldurduktan/submit ettikten sonra sonuç mesajı genelde
  `@load(vm.mesaj)` ile bağlı bir `<label>`'da görünür ve sayfa
  yeniden render edilmeden (SPA-benzeri AJAX) güncellenir - metin
  içeriğini `document.body.innerText` üzerinden substring ile ara.
- ZK Messagebox (onay diyaloğu) `.z-messagebox-window` veya
  `.z-window-highlighted` class'ıyla render olur; içindeki
  butonlar yine `clickButtonByText` ile bulunur (bkz.
  `zk.js#waitForMessagebox`, `#clickMessageboxButton`).

## React (nemesis-frontend) ozel notlari

- shadcn `<Input>`/`<Textarea>` her zaman `data-slot="input"` /
  `data-slot="textarea"` taşır - bu proje boyunca hiç değişmedi,
  güvenle sorgulanabilir.
- shadcn `<Select>` tetikleyicisi `data-slot="select-trigger"`,
  açılan öğeler `data-slot="select-item"` (base-ui altyapısı
  `role="option"` de ekliyor, ikisi de sorgulanabilir).
- **Dialog/AlertDialog açıkken arka plandaki sayfa DOM'dan
  KALDIRILMAZ** - örn. sayfanın kendi arama `Input`'u dialog açıkken
  de DOM'da kalır. `fillInputsInOrder` bu yüzden varsayılan olarak
  `[role="dialog"]` içine scope edilir (bkz. `react.js`). Aynı-sayfa
  formları (örn. Rapor Yonetimi gibi modal olmayan formlar - ki bu
  proje tüm formları Dialog'a taşıdı, ama gelecekte modal olmayan bir
  form eklenirse) için `root: null` geçilmeli.
- Başarı/hata bildirimleri `sonner` toast kütüphanesiyle gösterilir;
  her toast `[data-sonner-toast]` attribute'una sahiptir - içeriğinden
  bağımsız olarak stabildir, id'ye gerek yok (bkz.
  `react.js#waitForToast`).
- Tablo satırları düz `<table>`/`<tbody>`/`<tr>`/`<td>` (shadcn
  `Table` bileşeni özel bir wrapper eklemiyor) - `tbody tr` ve
  `td` ile doğrudan sorgulanabilir.
- Para/sayı formatlaması locale'e göre değişir (örn. toast mesajında
  `1500` girilen miktar `"1.500,00"` olarak Türkçe locale ile
  formatlanmış gösterilir) - toast/tablo metnini ararken ham sayıyı
  değil, biçimlendirilmiş halini de göz önünde bulundur ya da sadece
  anahtar kelimeye (örn. "olusturuldu") bak.

## Genel test verisi notlari

- `accounts` tablosunda hesap no'lar `10001`, `10002`, `10003`... gibi
  seed edilmiş durumda (bkz. Flyway migration'ları) - test
  senaryolarında bu mevcut hesapları kullan, yeni hesap oluşturmaya
  gerek yok.
- Yeni oluşturulan test kayıtlarının transfer_id/diğer PK değerleri
  seed verisinden çok daha yüksek bir aralıkta olur (örn.
  `20000+`) - bu, temizlik sorgusu yazarken "seed veriyi yanlışlıkla
  silme" riskini azaltır ama garantı değildir; her zaman spesifik bir
  WHERE koşulu (id veya benzersiz aciklama) kullan, asla toplu
  DELETE yapma.
- Her senaryonun test verisinde bir şekilde benzersizlik olmalı (örn.
  `aciklama` alanına `Date.now()` eklemek) - böylece art arda
  çalıştırmalar birbirine karışmaz ve DB doğrulaması yanlış (eski)
  bir satırı bulmaz.
