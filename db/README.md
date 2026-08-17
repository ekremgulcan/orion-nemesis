# Orion Veritabani Yapisi

Bu dizin, `src/main/resources/db/migration` altindaki Flyway migration
dosyalarinin okunabilir referans kopyalarini icerir. Amac: veritabani
semasinin nasil evrildigini kod disinda da takip edebilmek ve ileride bu
dosyalar uzerinden bir "database yapisi" skill'i uretebilmek.

> Flyway calisan (gercek) versiyon: `src/main/resources/db/migration/*.sql`
> Buradaki dosyalar birebir ayni icerigin kopyasidir, sadece dokumantasyon
> amaclidir. Semada degisiklik yaparken HER IKI yeri de guncelleyin
> (veya migration'i tekrar buraya kopyalayin).

## Migration Sirasi

| Dosya | Icerik |
|---|---|
| V1__core_schema.sql | Cekirdek semasi: roles, users, customers, accounts, instruments, account_balances, audit_log |
| V2__credit_schema.sql | Kredi Islemleri modulu: credit_accounts, credit_transactions, credit_optimization_runs, credit_optimization_results |
| V3__crm_schema.sql | CRM modulu: campaigns, campaign_targets, message_templates, messages |
| V4__workflow_schema.sql | Workflow modulu: workflow_processes, workflow_tasks |
| V5__seed_core.sql | Mock veri: 5 kullanici, 20 musteri, 27 hesap, 12 enstruman, hesap bakiyeleri |
| V6__seed_credit.sql | Mock veri: kredi hesaplari, islem gecmisi, ornek optimizasyon run + sonuclari |
| V7__seed_crm.sql | Mock veri: 3 kampanya, hedef hesaplar, sablonlar, ornek mesaj gonderimi |
| V8__seed_workflow.sql | Mock veri: 5 surec (CashTransfer, CreditOptimization, ...), 5 gorev |
| V9__collateral_schema.sql | Teminat Islemleri modulu: collaterals, collateral_transfers |
| V10__seed_collateral.sql | Mock veri: 15 depo kalemi, 15 teminat transfer talebi |
| V11__risk_schema.sql | Risk Parametreleri modulu: risk_profiles, user_limits, instrument_groups, instrument_group_members, account_instrument_controls |
| V12__seed_risk.sql | Mock veri: risk profilleri, kullanici limitleri, hisse gruplari, uclu kontrol kayitlari |
| V13__customer_management_schema.sql | Musteri Yonetim Sistemi: viop_risk_profiles, channel_authorizations |
| V14__seed_customer_management.sql | Mock veri: 10 VIOP risk profili, 12 kanal yetkilendirmesi |
| V15__cash_transaction_schema.sql | Nakit Yonetimi - Islem Giris modulu: cash_transaction_requests |
| V16__seed_cash_transaction.sql | Mock veri: 10 nakit islem talebi |
| V17__report_schema.sql | Rapor Yonetimi modulu: report_definitions |
| V18__seed_report.sql | Mock veri: 5 rapor tanimi |
| V19__meta_position_schema.sql | Meta Pozisyon Servisi modulu: position_shock_scenarios, position_snapshots |
| V20__seed_meta_position.sql | Mock veri: 7 sok senaryosu, 8 pozisyon anlik goruntusu |
| V21__seed_scale_core.sql | Veri hacmi buyutme: +7 kullanici, +80 musteri, +100 hesap, +34 enstruman |
| V22__seed_scale_credit.sql | Veri hacmi buyutme: yeni KREDI hesaplari icin credit_accounts + islem gecmisi |
| V23__seed_scale_collateral.sql | Veri hacmi buyutme: +50 depo kalemi, +60 teminat transfer talebi |
| V24__seed_scale_risk.sql | Veri hacmi buyutme: +40 risk profili, +14 kullanici limiti, +3 hisse grubu, +45 uclu kontrol |
| V25__seed_scale_customer_mgmt.sql | Veri hacmi buyutme: +50 VIOP risk profili, +60 kanal yetkilendirmesi |
| V26__seed_scale_cash.sql | Veri hacmi buyutme: +70 nakit islem talebi |
| V27__seed_scale_crm.sql | Veri hacmi buyutme: +2 kampanya, +90 hedef hesap, +30 mesaj |
| V28__seed_scale_workflow.sql | Veri hacmi buyutme: +15 surec, +15 gorev |
| V29__seed_scale_meta_position.sql | Veri hacmi buyutme: +50 pozisyon anlik goruntusu |
| V30__credit_optimization_result_uygulandi.sql | credit_optimization_results: uygulandi / uygulama_tarihi |
| V31__investor_schema.sql | Bireysel Yatirimci Bilgileri: customers/accounts genisletme + yatirimci alt tablolari |
| V32__seed_investor.sql | Mock veri: yatirimci alanlari, 1. musteri icin dolu alt sekmeler |
| V33__seed_investor_fill.sql | Tum musteriler icin yatirimci master + alt sekme verisi doldurma |

## Varlik Iliski Ozeti (ER)

```
users ---< user_roles >--- roles

customers ---< accounts

accounts ---< account_balances
accounts ---< credit_accounts ---< credit_transactions
accounts ---< credit_optimization_results >--- credit_optimization_runs >--- users (calistiran)

accounts ---< campaign_targets >--- campaigns ---< message_templates
accounts ---< messages >--- campaigns

workflow_processes ---< workflow_tasks >--- users (sahip)
workflow_processes -- (loose FK: referans_modul + referans_id) --> credit_optimization_runs / campaigns

accounts ---< collaterals
accounts ---< collateral_transfers >--- users (talep eden / onaylayan)

users ---< risk_profiles >--- accounts (opsiyonel)
users ---< user_limits
instrument_groups ---< instrument_group_members >--- instruments
users ---< account_instrument_controls >--- accounts >--- instruments

accounts ---< viop_risk_profiles (1-1)
users ---< channel_authorizations >--- accounts

accounts ---< cash_transaction_requests

users ---< report_definitions (olusturan / degistiren)

accounts ---< position_snapshots >--- instruments (opsiyonel)

customers ---< customer_addresses / customer_contacts / customer_identities (1-1)
customers ---< customer_notes / customer_education / customer_references
customers ---< customer_channels / customer_required_documents / customer_webmailer_prefs
customers ---< customer_external_bank_accounts / customer_suitability_tests / customer_external_user_ids
accounts ---< account_proxies / account_partners / account_commissions / account_contracts
accounts ---< account_channels / account_groups / account_custody / account_control_values
accounts ---< account_reporting_prefs / account_hidden_accounts / account_derivative_commissions
```

## Tablo Detaylari

### Cekirdek (V1)

**roles** - Sistem rolleri (ADMIN, OPERASYON, MUSTERI_TEMSILCISI, KREDI_UZMANI).

**users** - Sistem kullanicilari (calisanlar). `user_roles` ile coka-cok rol iliskisi.

**customers** - Musteri master data. `musteri_tipi` (BIREYSEL/KURUMSAL),
`risk_grubu` (DUSUK/ORTA/YUKSEK) alanlari var. `tckn_vkn` unique.

**accounts** - Musteriye bagli hesaplar. Bir musterinin birden fazla hesabi
olabilir (NAKIT, KREDI, VIOP gibi farkli tiplerde). `durum` alani hesabin
aktif/dondurulmus/kapali olmasini tutar (Hesap Durdurma Kurallari modulu
bunu gunceller).

**instruments** - Islem gorebilen enstrumanlar (hisse, VIOP sozlesmesi, SGMK,
Eurobond). `isin` unique.

**account_balances** - Her hesabin guncel bakiyesi + blokeli (teminata
baglanmis) bakiyesi.

**audit_log** - Tum modullerin ortak denetim kaydi tablosu (henuz otomatik
yazilmiyor, ileride AOP/interceptor ile doldurulmasi onerilir).

### Kredi Islemleri (V2)

Ekran: "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani"

**credit_accounts** - Bir `accounts` kaydinin (hesap_tipi=KREDI) kredi
limiti, kullanilan kredi bakiyesi ve serbest bakiyesini tutar.

**credit_transactions** - Kredi hesabindaki odeme/kullanim hareketleri,
`gun_tipi` (GUNBASI/GUNICI) ile ekrandaki iki buton (Gunbasi/Gunici
Islemlerini Baslat) arasindaki ayrimi yansitir.

**credit_optimization_runs** - Kullanicinin "Islemlerini Baslat" butonuna
her basisi bir run kaydi yaratir. `hedef_ozkaynak_orani` ekrandaki
"Ozkaynak Orani: 35.0" kutusuna karsilik gelir.

**credit_optimization_results** - Bir run'a bagli, her kredi hesabi icin
hesaplanan mevcut/yeni ozkaynak orani ve `UYGUN`/`UYGUN_DEGIL` durumu.
Ekrandaki "Uygun Hale Gelenler / Uygun Hale Gelmeyenler" tab'lari bu
tablonun `durum` alanina gore filtrelenir. `komposizyon` JSON alani
grid'deki "Komposizyon" kolonunu besler. `uygulandi`/`uygulama_tarihi`
(V30) alanlari, ekrandaki "Secilenler icin Surec Baslat" butonuyla bu
sonucun `credit_accounts.kredi_bakiyesi`'ne gercekten yansitilip
yansitilmadigini izler (bkz. `CreditOptimizationService.surecBaslat`).

Ozkaynak orani formulu (mock veride kullanilan):
```
ozkaynak_orani = serbest_bakiye * 100 / (serbest_bakiye + kredi_bakiyesi)
```

### CRM (V3)

Ekran: "Toplu Mesaj Gonder"

**campaigns** - Kampanya tanimlari (ornek: "Mutabakat 2026 Test679").

**campaign_targets** - Bir kampanyaya dahil edilen hesaplar ve onay
durumlari (ONAYLADI/ONAYLAMADI/AKSIYON_ALMADI/BEKLIYOR). Ekrandaki
"Alicilar: Hepsi / Onaylayanlar / Onaylamayanlar / Aksiyon Almayanlar"
radyo butonlari bu alana gore filtreler; "Belirli Hesaplar" secenegi ise
dogrudan `accounts.hesap_no` ile eslesir.

**message_templates** - Kampanyaya (opsiyonel) bagli, kanal bazli (EMAIL/SMS)
hazir mesaj sablonlari. Ekrandaki "E-Mail/SMS Sablonuyla Ayni" secenegi
buradan icerik ceker; "Yeni" secilirse kullanici serbest metin girer.

**messages** - Gonderilen her mesajin kaydi (gercek SMS/Email saglayicisina
baglanmadan durum=GONDERILDI olarak simule edilir).

### Workflow (V4)

Ekran: "Uzerimdeki Gorevler / Tamamlanmis Gorevlerim / Surec Listesi"

**workflow_processes** - Sistemdeki her is surecinin (CashTransfer,
CreditOptimization, CampaignMessage, AccountSuspension, ...) kaydi.
`surec_no` ekrandaki "Surec Numarasi" kolonuna, `surec_tipi` ise "Surec
Adi" kolonuna karsilik gelir (ornek: 213144 / CashTransfer).
`referans_modul` + `referans_id` alanlari, surecin hangi modulden
(CREDIT/CRM) tetiklendigini gevsek (loose) FK ile baglar - boylece
workflow modulu diger modullere sert bagimlilik olusturmaz.

**workflow_tasks** - Bir surece bagli gorevler. `gorev_ozeti` ekrandaki
"Gorev Ozeti" kolonuna (ornek: "Problem Yonetimi"), `sahip_user_id` ise
"Sahip" kolonuna karsilik gelir. `durum=ACIK` olanlar "Uzerimdeki
Gorevler" tab'inda, `durum=TAMAMLANDI` olanlar "Tamamlanmis Gorevlerim"
tab'inda listelenir; tum kayitlar "Surec Listesi" tab'inda gorunur.

### Teminat Islemleri (V9)

Ekranlar: "Teminat Transfer", "Teminat Onay Ekrani", "Teminat Dosya Yukleme"

**collaterals** - Bir hesabin serbest depo / teminat deposu tarafinda
tuttugu varlik kalemleri (`depo_tipi`: SERBEST/TEMINAT, `varlik_tipi`:
NAKIT/DOVIZ/PAY_SENEDI/BORCLANMA_ARACI/FON).

**collateral_transfers** - Serbest depo <-> teminat deposu virman
talepleri. `durum` alani ekrandaki "Teminat Onay Ekrani" tab'larina
karsilik gelir (BEKLEMEDE, TAMAMLANDI, IPTAL, PROBLEM, REVIZYONDA,
HAVUZDA, TAKAS_HATALI). `dosyali_mi` Excel toplu yukleme ile gelen
talepleri ayirt eder ("Teminat Dosya Yukleme" ekrani).

```sql
CREATE TABLE collaterals (
    collateral_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT NOT NULL REFERENCES accounts(account_id),
    depo_tipi         VARCHAR(20)   NOT NULL,          -- SERBEST / TEMINAT
    varlik_tipi       VARCHAR(20)   NOT NULL,          -- NAKIT / DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON
    instrument_id     BIGINT        NULL REFERENCES instruments(instrument_id),
    para_birimi       VARCHAR(10)   NULL,
    miktar            DECIMAL(18,4) NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE collateral_transfers (
    transfer_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT        NOT NULL REFERENCES accounts(account_id),
    piyasa             VARCHAR(20)   NOT NULL DEFAULT 'BIST',
    saklamaci          VARCHAR(50)   NOT NULL DEFAULT 'MKK',
    teminat_tipi       VARCHAR(20)   NOT NULL,          -- NAKIT_DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON
    kaynak_depo        VARCHAR(20)   NOT NULL,          -- SERBEST / TEMINAT
    hedef_depo         VARCHAR(20)   NOT NULL,          -- TEMINAT / SERBEST
    instrument_id      BIGINT        NULL REFERENCES instruments(instrument_id),
    para_birimi        VARCHAR(10)   NULL,
    miktar             DECIMAL(18,4) NOT NULL,
    dosyali_mi         BIT           NOT NULL DEFAULT 0,
    durum              VARCHAR(30)   NOT NULL DEFAULT 'BEKLEMEDE', -- BEKLEMEDE/TAMAMLANDI/IPTAL/PROBLEM/REVIZYONDA/HAVUZDA/TAKAS_HATALI
    talep_eden_kullanici_id BIGINT   NULL REFERENCES users(user_id),
    onaylayan_kullanici_id  BIGINT   NULL REFERENCES users(user_id),
    talep_tarihi       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    onay_tarihi        DATETIME2     NULL,
    aciklama           NVARCHAR(300) NULL
);
```

### Risk Parametreleri (V11)

Ekranlar: "Hisse Risk Parametreleri", "Sabit Getiri Risk Tanimlama",
"Kullanici Limit Tanimi", "Hisse Grubu Tanimlama", "Kullanici/Hesap/Hisse
Bazinda Kontrol". PDF'te bu ekranlar HISSE ve SGMK icin ayri ayri
gosterilse de, kod tekrarini azaltmak amaciyla **tek tabloda**
`enstruman_tipi` filtresiyle birlestirildi (ayri tablo/ekran degil).

**risk_profiles** - Kullanici ve/veya hesap bazinda alis/satis/acik satis
kontrolu + A/B/C/D grup nakit kontrolleri, `enstruman_tipi` (HISSE/SGMK)
ile ayrisir.

**user_limits** - Kullanici bazinda gunluk toplam limit + anlik islem
limiti, `enstruman_tipi` ile ayrisir.

**instrument_groups** / **instrument_group_members** - Hisse grubu
tanimlama (ornek: BANKACILIK, SANAYI, ULASIM gruplari).

**account_instrument_controls** - Kullanici/hesap/hisse uclu
kombinasyonunda en detayli seviyedeki alis/satis/acik satis izni.

```sql
CREATE TABLE risk_profiles (
    risk_profile_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    enstruman_tipi    VARCHAR(20)   NOT NULL,          -- HISSE / SGMK
    user_id           BIGINT        NULL REFERENCES users(user_id),
    account_id        BIGINT        NULL REFERENCES accounts(account_id),
    alis_kontrol      BIT           NOT NULL DEFAULT 1,
    satis_kontrol     BIT           NOT NULL DEFAULT 1,
    acik_satis_kontrol BIT          NOT NULL DEFAULT 0,
    grup_a_nakit_kontrol BIT        NOT NULL DEFAULT 1,
    grup_b_nakit_kontrol BIT        NOT NULL DEFAULT 1,
    grup_c_nakit_kontrol BIT        NOT NULL DEFAULT 0,
    grup_d_nakit_kontrol BIT        NOT NULL DEFAULT 0,
    aktif             BIT           NOT NULL DEFAULT 1,
    guncelleme_tarihi DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE user_limits (
    user_limit_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id             BIGINT      NOT NULL REFERENCES users(user_id),
    enstruman_tipi      VARCHAR(20) NOT NULL,          -- HISSE / SGMK
    gunluk_toplam_limit DECIMAL(18,2) NOT NULL,
    anlik_islem_limiti  DECIMAL(18,2) NOT NULL,
    guncelleme_tarihi   DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE instrument_groups (
    group_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    grup_kodu    VARCHAR(30)   NOT NULL UNIQUE,
    aciklama     NVARCHAR(200) NULL,
    aktif        BIT           NOT NULL DEFAULT 1
);

CREATE TABLE instrument_group_members (
    group_id      BIGINT NOT NULL REFERENCES instrument_groups(group_id),
    instrument_id BIGINT NOT NULL REFERENCES instruments(instrument_id),
    PRIMARY KEY (group_id, instrument_id)
);

CREATE TABLE account_instrument_controls (
    control_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(user_id),
    account_id       BIGINT NOT NULL REFERENCES accounts(account_id),
    instrument_id    BIGINT NOT NULL REFERENCES instruments(instrument_id),
    alis_izni        BIT    NOT NULL DEFAULT 1,
    satis_izni       BIT    NOT NULL DEFAULT 1,
    acik_satis_izni  BIT    NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Musteri Yonetim Sistemi (V13)

Ekranlar: "Hesap Bazinda VIOP Risk Profili Tanim", "TradeMaster
Yetkilendirme"

**viop_risk_profiles** - Hesap basina 1 kayit (UNIQUE), profil adi
(Kurum Temkinli 2 Kat / Kurum Standart 1.5 Kat / Takasbank Birebir) ve
carpan degeri.

**channel_authorizations** - Kullaniciya hesap + kanal (TRADEMASTER /
INTERNET_SUBESI / MOBIL / CAGRI_MERKEZI) bazinda yetki tanimi.

```sql
CREATE TABLE viop_risk_profiles (
    viop_risk_profile_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id           BIGINT        NOT NULL REFERENCES accounts(account_id) UNIQUE,
    profil_adi           VARCHAR(50)   NOT NULL,      -- Kurum Temkinli 2 Kat / Kurum Standart 1.5 Kat / Takasbank Birebir
    carpan               DECIMAL(5,2)  NOT NULL,      -- 2.00 / 1.50 / 1.00
    guncelleme_tarihi    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE channel_authorizations (
    channel_auth_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(user_id),
    account_id       BIGINT      NOT NULL REFERENCES accounts(account_id),
    kanal            VARCHAR(30) NOT NULL,             -- TRADEMASTER / INTERNET_SUBESI / MOBIL / CAGRI_MERKEZI
    yetki_durumu     VARCHAR(20) NOT NULL DEFAULT 'AKTIF', -- AKTIF / PASIF
    tanimlama_tarihi DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Bireysel Yatirimci Bilgileri (V31)

Ekran: ZK `core/bireysel-yatirimci.zul` (React henuz yok).

`customers` tablosuna yatirimci master alanlari eklendi (isim/soyisim,
vergi, IYS izinleri, nitelikli yatirimci, MKK/Takasbank sicil, vb.).
`accounts` tablosuna hesap duzenleme alanlari eklendi (`hesap_sinifi`,
danisman, dis sistem checkbox'lari). Mevcut `hesap_tipi` (NAKIT/KREDI/VIOP)
diger moduller icin aynen durur.

Musteri alt sekmeleri: `customer_addresses`, `customer_contacts`,
`customer_identities` (1-1), `customer_channels`, `customer_required_documents`,
`customer_notes`, `customer_external_bank_accounts`, `customer_education`,
`customer_references`, `customer_webmailer_prefs`, `customer_suitability_tests`,
`customer_external_user_ids`.

Hesap duzenleme alt sekmeleri: `account_proxies`, `account_partners`,
`account_commissions`, `account_contracts`, `account_channels`,
`account_groups`, `account_custody`, `account_control_values`,
`account_reporting_prefs`, `account_hidden_accounts`,
`account_derivative_commissions`.

### Nakit Yonetimi - Islem Giris (V15)

**cash_transaction_requests** - Ekrandaki para transfer formunun
kaydi: talep kanali, emir veren, valor tarihi, tutar/para birimi,
odeme/tahsilat yonu, IBAN/Hesap/Yinele-GVT yontemi, IYM banka hesabi.

```sql
CREATE TABLE cash_transaction_requests (
    request_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT        NOT NULL REFERENCES accounts(account_id),
    talep_kanali        VARCHAR(30)   NOT NULL DEFAULT 'SUBE', -- SUBE / INTERNET / TRADEMASTER / CAGRI_MERKEZI
    emir_veren          NVARCHAR(150) NOT NULL,
    valor_tarihi        DATE          NOT NULL,
    tutar               DECIMAL(18,2) NOT NULL,
    para_birimi         VARCHAR(10)   NOT NULL DEFAULT 'TRY',
    islem_yonu          VARCHAR(20)   NOT NULL,          -- ODEME / TAHSILAT
    yontem              VARCHAR(20)   NOT NULL DEFAULT 'IBAN', -- IBAN / HESAP / YINELE_GVT
    iban                VARCHAR(34)   NULL,
    karsi_hesap_no      VARCHAR(20)   NULL,
    iym_banka_hesabi    VARCHAR(50)   NULL,
    durum               VARCHAR(20)   NOT NULL DEFAULT 'BEKLEMEDE', -- BEKLEMEDE/ONAYLANDI/REDDEDILDI/TAMAMLANDI
    aciklama            NVARCHAR(300) NULL,
    olusturma_tarihi    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Rapor Yonetimi (V17)

**report_definitions** - Rapor tanimlari listesi (rapor adi, sinifi,
zamanlama, mail gonder flag'i). `icerik` alani PDF'teki CKEditor zengin
metin editorunu **basit metin/HTML alani** olarak simule eder (gercek
zengin metin editoru entegre edilmedi).

```sql
CREATE TABLE report_definitions (
    report_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    rapor_adi            NVARCHAR(150) NOT NULL,
    rapor_sinifi         VARCHAR(100)  NOT NULL,       -- ornek: com.orion.report.GunlukPozisyonRaporu
    zamanlama            VARCHAR(50)   NOT NULL DEFAULT 'MANUEL', -- MANUEL / GUNLUK / HAFTALIK / AYLIK
    mail_gonder          BIT           NOT NULL DEFAULT 0,
    icerik               NVARCHAR(MAX) NULL,
    aktif                BIT           NOT NULL DEFAULT 1,
    olusturan_kullanici_id BIGINT      NULL REFERENCES users(user_id),
    degistiren_kullanici_id BIGINT     NULL REFERENCES users(user_id),
    olusturma_tarihi     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    guncelleme_tarihi    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Meta Pozisyon Servisi (V19)

**position_shock_scenarios** - Currency pair bazinda sok senaryolari
(ornek: "USD Guclu Sok" / USD/TRY / +15.00).

**position_snapshots** - Hesap/enstruman bazinda anlik pozisyon
kaydi, sok senaryolarinin uygulanacagi taban veri.

```sql
CREATE TABLE position_shock_scenarios (
    scenario_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    senaryo_adi       NVARCHAR(100) NOT NULL,
    currency_pair     VARCHAR(20)   NOT NULL,          -- USD/TRY, EUR/TRY, EUR/USD, ...
    sok_yuzdesi       DECIMAL(6,2)  NOT NULL,
    aktif             BIT           NOT NULL DEFAULT 1,
    olusturma_tarihi  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE position_snapshots (
    snapshot_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT        NOT NULL REFERENCES accounts(account_id),
    instrument_id     BIGINT        NULL REFERENCES instruments(instrument_id),
    miktar            DECIMAL(18,4) NOT NULL,
    referans_fiyat    DECIMAL(18,4) NOT NULL,
    kayit_tarihi      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
```

## Seed (Mock Veri) Ozeti

Her schema migration'inin hemen ardindan gelen seed migration'i, o
modulun ekranlarini bos gormemek icin gercekci Türkçe mock veri ekler.
Hacimler bilincli olarak kucuk/orta tutuldu (okunabilir kalsin diye):

| Migration | Icerik |
|---|---|
| V10__seed_collateral.sql | 15 depo kalemi (serbest/teminat), 15 teminat transfer talebi (BEKLEMEDE/TAMAMLANDI/IPTAL/PROBLEM/REVIZYONDA/HAVUZDA/TAKAS_HATALI durumlari karisik) |
| V12__seed_risk.sql | 12 risk profili (HISSE+SGMK), 6 kullanici limiti, 3 hisse grubu (BANKACILIK/SANAYI/ULASIM) + uyeleri, 8 uclu kontrol kaydi |
| V14__seed_customer_management.sql | 10 VIOP risk profili (Kurum Temkinli/Standart/Takasbank Birebir karisik), 12 kanal yetkilendirmesi |
| V16__seed_cash_transaction.sql | 10 nakit islem talebi (odeme/tahsilat, farkli kanal/durum kombinasyonlari) |
| V18__seed_report.sql | 5 rapor tanimi (gunluk/haftalik/aylik/manuel zamanlama karisik) |
| V20__seed_meta_position.sql | 7 sok senaryosu (USD/EUR bazli), 8 pozisyon anlik goruntusu |

### Veri Hacmi Buyutme (V21-V29)

`plan.md` / kullanici talebiyle, ekranlarin gercekci ve kalabalik
gorunmesi icin V21'de cekirdek tablolar (musteri/hesap/enstruman/
kullanici) buyutuldu, V22-V29'da ise buna bagli tum modullerin mock
verisi orantili olarak arttirildi. Bu asamadan sonra veritabani su
hacimde:

| Tablo | Once (V1-V20) | Sonra (V1-V29) |
|---|---|---|
| customers | 20 | 100 |
| accounts | 28 | 128 |
| instruments | 12 | 46 |
| users | 5 | 12 |
| credit_accounts | 8 | 28 |
| credit_transactions | 16 | 112 |
| collaterals | 15 | 65 |
| collateral_transfers | 15 | 65 |
| risk_profiles | 12 | 46 |
| account_instrument_controls | 8 | 41 |
| viop_risk_profiles | 10 | 60 |
| channel_authorizations | 12 | 62 |
| cash_transaction_requests | 10 | 60 |
| campaigns | 3 | 5 |
| campaign_targets | 25 | 115 |
| messages | 1 | 31 |
| workflow_processes | 5 | 20 |
| workflow_tasks | 5 | 20 |
| position_snapshots | 8 | 58 |

Uretim yontemi: `scripts/gen_v21_core.py` ve `scripts/gen_v23_v29.py`
adli tek seferlik Python yardimci scriptleri, deterministik (rastgele
degil, hep ayni sonucu ureten) isim/hesap/miktar kombinasyonlari
uretip dogrudan migration SQL dosyalarina yazdi. Bu scriptler
uygulamanin bir parcasi degildir, sadece migration dosyalarini
authoring etmek icin kullanildi; tekrar calistirmaya gerek yoktur.

## Migration Calistirma / Dogrulama

Uygulama her ayaga kalktiginda Flyway otomatik olarak `dbo` semasindaki
mevcut versiyonu kontrol eder ve eksik migration'lari sirayla uygular
(elle bir sql calistirmaya gerek yok). Dogrulamak icin uygulama
loglarinda su satirlari aramak yeterli:

```
o.f.core.internal.command.DbMigrate : Migrating schema [dbo] to version "9 - collateral schema"
...
o.f.core.internal.command.DbMigrate : Successfully applied 12 migrations to schema [dbo], now at version v20
```

Eger sema zaten guncelse (yeniden baslatmada) su satir gorulur:

```
o.f.core.internal.command.DbMigrate : Schema [dbo] is up to date. No migration necessary.
```

Manuel olarak DB'ye baglanip kontrol etmek icin (Docker container
icindeki `sqlcmd` ile):

```bash
docker exec -it orion-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Orion_2026_Str0ng!' -C \
  -Q "SELECT name FROM sys.tables ORDER BY name;"
```

## Ileride Eklenecek Modul Tablolari (henuz olusturulmadi)

Asagidaki tablolar, ilgili modul derinlestirildikce ayni desenle
(schema + seed + entity + ZUL ekrani) eklenecek. Simdilik sadece
plan.md'de tasarim olarak yer aliyor:

`orders`, `order_executions`, `special_rate_definitions`,
`bank_integration_transactions`, `account_suspension_rules`,
`account_status_log`, `repo_deals`, `repo_settlements`, `otc_deals`,
`firm_portfolio_transactions`, `fifo_reconciliation_records`,
`ipo_offerings`, `ipo_subscriptions`, `report_schedules`, `report_runs`,
`regulatory_reports`, `research_reports`, `market_data_feeds`,
`crm_tickets`, `instrument_price_history`, `circuit_breaker_events`,
`exchange_sessions`.
