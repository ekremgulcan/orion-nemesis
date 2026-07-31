# Orion v3 Nemesis - Proje Plani

> Kaynak: design-screenshots/ altindaki 4 ekran goruntusunden cikarilan analiz.
> Orijinal sistem: "Orion" adli bir araci kurum (broker) back-office + trading platformu.
> ZK framework ile yazilmis, sol tarafta 33 modulluk dev bir menu agaci var, sagda tab bazli ekranlar aciliyor.

## Teknoloji Kararlari

| Konu | Karar |
|---|---|
| Backend | Spring Boot 3.x + Spring Data JPA + Hibernate |
| Frontend | ZK7 (server-side, Spring entegrasyonu ile MVVM) |
| Veritabani | MS SQL Server (lokal gelistirme icin Docker container) |
| Migration / Seed | Flyway (SQL dosyalari `db/migration` altinda, ayni zamanda `db/` dizininde referans olarak korunuyor) |
| Build | Maven |

## Genel Mimari

```
orion/
  src/main/java/com/orion/
    core/          -> Customer, Account, Instrument, User/Role (ortak domain)
    credit/        -> Kredi Islemleri modulu
    crm/           -> CRM / Toplu Mesaj modulu
    workflow/      -> Gorev / Surec Listesi modulu
    common/        -> audit, exception, util
  src/main/webapp/
    core/, credit/, crm/, workflow/   (.zul sayfalari, modul bazli)
  src/main/resources/
    application.yml
    db/migration/  (Flyway SQL: V1__..., V2__..., ...)
  db/
    README.md      (tum tablo semasinin dokumantasyonu - ileride skill uretimi icin kaynak)
    *.sql          (Flyway'deki scriptlerin okunabilir kopyalari / referans)
  docker-compose.yml (MS SQL Server container)
```

## Ekran Goruntusu Analizi (Kaynak Bulgular)

1. **Kredi Islemleri** -> "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani"
   - Gunbasi/Gunici islemlerini baslatip listeleyen, ozkaynak oranina gore
     "Uygun Hale Gelenler / Gelmeyenler" ayrimi yapan, secili hesaplar icin
     surec baslatan ve Excel export eden bir ekran.
2. **CRM / Musteri Iletisim Panosu** -> "Toplu Mesaj Gonder"
   - Bir kampanyaya bagli, belirli hedef kitleye (hepsi/onaylayanlar/
     onaylamayanlar/aksiyon almayanlar/belirli hesaplar) SMS veya E-posta
     gonderen ekran. Mesaj icerigi sablondan ya da yeni girilebiliyor.
3. **Ana Sayfa / Is Akisi** -> "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi"
   - Bir workflow/BPM task inbox'i. Ornek kayit: Surec No 213144,
     Surec Adi "CashTransfer", Gorev Ozeti "Problem Yonetimi".
4. **Sol Menu (33 modul)** -> Tum sistemin navigasyon iskeleti.

## Sol Menu - 33 Modulun Islev/Veri Analizi

### Piyasa / Trading
- **VIOP Kotasyon Izleme / Hisse Kotasyon Izleme**: Canli fiyat izleme -> `instruments`, `quotes`
- **Yeni Hisse Emir Yonetimi / Akilli Emir / Yurtdisi OMS**: Emir girisi/yonetimi -> `orders`, `order_executions`
- **NOMX**: Borsa Istanbul eslestirme motoru izleme -> `exchange_sessions`
- **Colocation Circuit Breaker**: Borsa baglanti devre kesici izleme -> `circuit_breaker_events`
- **Meta Pozisyon Servisi**: Tum piyasalardaki pozisyonlarin birlesik gorunumu -> `positions` (agregasyon)
- **Volatilite Raporu**: Risk/marjin icin oynaklik raporu -> `instrument_price_history`

### Musteri / CRM
- **Musteri Yonetim Sistemi**: Musteri master data, KYC, risk profili -> `customers`, `accounts`, `kyc_documents`
- **Musteri Iletisim Panosu / CRM**: Kampanya, toplu mesaj, sikayet/talep -> `campaigns`, `campaign_targets`, `messages`, `crm_tickets`
- **Simulasyonlar**: Musteri bazli risk/marjin simulasyonu -> `accounts`, `positions` uzerinde hesap

### Kredi / Nakit / Teminat
- **Kredi Islemleri**: Ozkaynak orani optimizasyonu -> `credit_accounts`, `credit_transactions`, `credit_optimization_runs`
- **Nakit Yonetimi**: Para giris/cikis, virman -> `cash_transactions`, `account_balances`
- **Teminat Islemleri**: VIOP/kredi teminat takibi -> `collaterals`, `collateral_movements`
- **SGMK - Ozel Oran Tanimlari**: Musteri/hesap ozel faiz/marjin orani -> `special_rate_definitions`
- **Is Bankasi**: Banka entegrasyonu (odeme) -> `bank_integration_transactions`
- **Hesap Durdurma Kurallari**: Risk kurallarina gore otomatik dondurma -> `account_suspension_rules`, `account_status_log`

### Repo / OTC / Kurumsal
- **Hisse Repo / Eurobond Repo**: Repo/ters repo sozlesmeleri -> `repo_deals`, `repo_settlements`
- **OTC**: Borsa disi islemler -> `otc_deals`
- **Kurum Portfoy Islemleri**: Kurumun kendi portfoy islemleri -> `firm_portfolio_transactions`
- **Kurum Fifo Mutabakati**: FIFO muhasebe mutabakati -> `fifo_reconciliation_records`
- **Halka Arz Islemleri**: IPO talep toplama/dagitim -> `ipo_offerings`, `ipo_subscriptions`

### Raporlama / Yasal / Sistem
- **Raporlar / Rapor Yonetimi**: Rapor sablonlari, zamanlanmis raporlar -> `report_definitions`, `report_schedules`, `report_runs`
- **Yasal Raporlamalar**: SPK/Takasbank/MKK bildirimleri -> `regulatory_reports`
- **Arastirma**: Analist raporlari -> `research_reports`
- **Piyasa Veri Yonetimi (x2)**: Referans veri/fiyat besleme yonetimi -> `market_data_feeds`, `instruments`
- **IDC Surecleri**: Veri saglayici/is akisi surecleri -> `workflow_processes` altinda ozel tip
- **Yonetim Paneli**: Sistem/kullanici/rol yonetimi -> `users`, `roles`, `permissions`

## Ortak Cekirdek Veri Modeli

```
customers          (musteri_id, ad_soyad/unvan, tckn_vkn, risk_grubu, ...)
accounts            (hesap_no, customer_id FK, hesap_tipi, durum)
instruments         (isin, sembol, tip, borsa)
account_balances    (account_id FK, bakiye, blokeli_bakiye)
orders              (account_id FK, instrument_id FK, yon, miktar, fiyat, durum)
positions           (account_id FK, instrument_id FK, miktar, maliyet)
cash_transactions   (account_id FK, tutar, tip, tarih)
credit_accounts / credit_transactions
collaterals
campaigns / campaign_targets / messages
workflow_processes / workflow_tasks
users / roles / permissions
audit_log
```

## Fazlama

- **Faz 0 - Iskelet**: Spring Boot + ZK7 + MS SQL baglantisi, sol menude 33 modulun
  tamami gorunur (statik agac), sadece 3 modul gercek ekran acar digerleri
  "Yapim Asamasinda" placeholder. Cekirdek tablolar + mock veri (Flyway ile).
- **Faz 1 - Kredi Islemleri**: Optimizasyon ekrani uctan uca calisir.
- **Faz 2 - CRM Toplu Mesaj**: Kampanya bazli mesaj gonderim ekrani calisir.
- **Faz 3 - Gorev/Surec Listesi**: Workflow inbox ekrani calisir.
- **Faz 4+ (sonra)**: Kalan 30 modul, kullanicinin onceligine gore ayni desenle
  (tablo + ekran + mock veri) derinlestirilir.

## Mock Veri Stratejisi

- Gercekci Turkce isim/unvan, TCKN/VKN formatli ama sahte kimlikler.
- BIST'te gercekten islem goren birkac sembol (THYAO, GARAN, AKBNK) + kurgusal
  VIOP/SGMK enstrumanlari.
- Hesap/pozisyon/bakiye verileri rastgele degil, iliskisel kurallara gore
  uretilir (ornek: kredi_bakiyesi < kredi_limiti, ozkaynak orani gercek
  formulle hesaplanir).
- Tum DDL + seed SQL komutlari `db/migration` (Flyway calisan versiyon) VE
  `db/` dizininde okunabilir referans kopyalar olarak saklanir -> ileride bu
  dosyalar uzerinden database yapisini anlatan bir skill uretilecek.

## Calistirma (ozet)

1. `docker compose up -d` -> MS SQL Server container ayaga kalkar.
2. `mvn spring-boot:run` -> Flyway migration'lari otomatik calisir, uygulama
   ZK7 arayuzuyle acilir.
