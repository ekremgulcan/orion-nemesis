# Orion v3 Nemesis — Operasyon Danışman Bilgi Tabanı

Asistan **iki modda** çalışır:
- **Danışman (default):** ekran/buton/tablo yönlendirir, read-only tool ile veri okur; kayıt oluşturmaz/onaylamaz.
- **Yürütücü:** aynı bilgi + yazma tool'ları (teminat onay/iptal/revizyon/havuz, nakit onay/red). Yazma **doğrudan uygulanmaz** — panelde Onayla/Vazgeç kartı zorunlu.
Kaynak: `db/README.md`, Flyway V1–V32, `nemesis-frontend` pages, `menu-registry.ts`.

## Yürütücü mod (v1 yazma tool'ları)

| Tool | Etki |
|------|------|
| `approveCollateralTransfer` | BEKLEMEDE → TAMAMLANDI + `collaterals` miktar güncelle |
| `cancelCollateralTransfer` | → IPTAL |
| `reviseCollateralTransfer` | → REVIZYONDA |
| `poolCollateralTransfer` | → HAVUZDA |
| `approveCashTransaction` | Nakit talep onay + bakiye güncelle |
| `rejectCashTransaction` | Nakit talep red |

Kullanıcı/CRUD oluşturma, silme, teminat talep oluşturma **yok** — ilgili React ekranına yönlendir.
Auth/JWT yok (demo); yürütücü herkese açık — dikkatli kullan.

## Platform

| Katman | Adres / teknoloji |
|--------|-------------------|
| React (Nemesis) | `http://localhost:5173` — Vite, REST `/api/v1` |
| ZK7 (legacy) | `http://localhost:8080/index.zul` |
| Backend | Spring Boot 2.7, paylaşılan `@Service` |
| DB | MSSQL `orion`, Docker `localhost:1433`, Flyway V1–V32 |

**Önemli:** Stored procedure / view / function / trigger **yok**. İş kuralları Java `@Service` içinde.
**Auth:** JWT yok (demo). Workflow görev listesi şu an kullanıcıyı hardcode (`ademir`) kullanabilir.
**audit_log:** tablo var, otomatik doldurulmuyor.

Bağlantı örneği:
```bash
sqlcmd -S localhost,1433 -U sa -P 'Orion_2026_Str0ng!' -d orion -C
```

---

## Menü → React path (aktif)

| Menü etiketi | Path | Ana tablolar |
|--------------|------|--------------|
| Ana Sayfa (sidebar dışı) | `/workflow/gorev-listesi` | `workflow_processes`, `workflow_tasks` |
| VIOP Kotasyon İzleme | `/core/viop-kotasyon` | `instruments` (tip=VIOP) |
| Hisse Kotasyon İzleme | `/core/hisse-kotasyon` | `instruments` (tip=HISSE) |
| Piyasa Veri Yönetimi | `/core/piyasa-veri-yonetimi` | `instruments` |
| Müşteri Yönetim Sistemi | `/core/musteriler` | `customers` |
| Bireysel Yatırımcı Bilgileri (şimdilik yalnız ZK) | ZK: `/core/bireysel-yatirimci.zul` | `customers` + V31 alt tablolar |
| TradeMaster Yetkilendirme | `/core/trademaster-yetkilendirme` | `channel_authorizations` |
| VIOP Risk Profili Tanım | `/core/viop-risk-profili` | `viop_risk_profiles` |
| Yönetim Paneli | `/core/yonetim-paneli` | `users`, `roles`, `user_roles` |
| Müşteri İletişim Panosu / CRM | `/crm/toplu-mesaj-gonder` | `campaigns`, `campaign_targets`, `messages`, `message_templates` |
| Nakit Yönetimi | `/cash/yonetimi` | `account_balances` |
| Nakit İşlem Giriş | `/cash/islem-giris` | `cash_transaction_requests` |
| Teminat İşlemleri | `/collateral/islemleri` | `collaterals`, `collateral_transfers` |
| Teminat Onay Ekranı | `/collateral/onay` | `collateral_transfers`, `collaterals` |
| Yeni Hisse Emir Yönetimi | `/risk/risk-parametreleri` | `risk_profiles`, `user_limits` |
| Hisse Grubu Tanımlama | `/risk/hisse-grubu-tanimlama` | `instrument_groups`, `instrument_group_members` |
| Hesap/Hisse Bazında Kontrol | `/risk/hesap-hisse-kontrol` | `account_instrument_controls` |
| Kredi İşlemleri | `/credit/kredi-optimizasyon` | `credit_accounts`, `credit_optimization_runs/results` |
| Meta Pozisyon Servisi | `/meta/meta-pozisyon-servisi` | `position_snapshots`, `position_shock_scenarios` |
| Rapor Yönetimi | `/report/rapor-yonetimi` | `report_definitions` |

**Placeholder** (React: “yapım aşamasında”, DB tablosu yok): Halka Arz, SGMK Özel Oran, Volatilite Raporu, IDC, Simülasyonlar, Hesap Durdurma, Akıllı Emir, Raporlar, Yurtdışı OMS, Kurum Portföy, NOMX, Hisse Repo, FIFO Mutabakatı, Circuit Breaker, Araştırma, Yasal Raporlamalar, Eurobond Repo, OTC.

---

## Ekran kartları (buton + veri + REST)

### Yönetim Paneli — `/core/yonetim-paneli`
- **Ne işe yarar:** Kullanıcı CRUD + rol atama.
- **Butonlar:** Yeni Kullanıcı · Düzenle · Sil · Kaydet · Vazgeç.
- **Grid:** Kullanıcı Adı, Ad Soyad, E-Posta, Roller, Aktif.
- **Form:** kullaniciAdi, adSoyad, email, aktif, rol checkbox.
- **API:** `GET/POST/PUT/DELETE /api/v1/core/users`, `GET .../users/roles`.
- **DB:** `users`, `roles`, `user_roles`. Roller seed: ADMIN, OPERASYON, MUSTERI_TEMSILCISI, KREDI_UZMANI.
- **ZK:** `core/kullanicilar.zul`.
- **Adımlar (rol değiştir):** Menü → Yönetim Paneli → satır Düzenle → Roller → Kaydet.

### TradeMaster Yetkilendirme — `/core/trademaster-yetkilendirme`
- **Ne:** Kullanıcı+hesap+kanal yetkisi (Yönetim Paneli’nden farklı).
- **Butonlar:** Yeni Yetki · Düzenle · Sil · Kaydet.
- **Grid:** Kullanıcı, Hesap No, Müşteri, Kanal, Yetki Durumu, Tanımlama Tarihi.
- **Kanal enum:** TRADEMASTER, INTERNET_SUBESI, MOBIL, CAGRI_MERKEZI. Durum: AKTIF/PASIF.
- **API:** `/api/v1/core/channel-authorizations`.
- **DB:** `channel_authorizations`.

### Müşteri Yönetim Sistemi — `/core/musteriler`
- **Butonlar:** Yeni Müşteri · Düzenle · Sil · Kaydet.
- **Grid:** Müşteri No, Ad Soyad/Unvan, Tip, TCKN/VKN, Risk Grubu, Aktif.
- **Enum:** musteri_tipi BIREYSEL/KURUMSAL; risk_grubu DUSUK/ORTA/YUKSEK.
- **API:** `/api/v1/core/customers`.
- **DB:** `customers` (+ ilişkili `accounts` ayrı tabloda).

### Bireysel Yatırımcı Bilgileri — ZK `/core/bireysel-yatirimci.zul`
- **Ne:** CRM tarzı bireysel yatırımcı master + 13 alt sekme + Hesap Düzenle modalı (11 sekme).
- **Butonlar:** Getir · Yeni Yatırımcı · Kaydet · Hesap +/Düzenle · sekme içi +.
- **ZK:** `core/bireysel-yatirimci.zul`. React henüz yok.
- **DB:** V31/V32. `InvestorService` iş kuralları.
- **Kurallar:** TCKN ve İsim zorunlu; alt kayıt için önce yatırımcı kaydı gerekir.

### Teminat İşlemleri — `/collateral/islemleri`
- **Ne:** Transfer **talebi oluşturma** (onay burada değil).
- **Butonlar:** Yeni Transfer Talebi · Transfer Talebi Oluştur · Vazgeç.
- **Grid (depo):** Hesap No, Müşteri, Depo Tipi, Varlık Tipi, Enstrüman, Para Birimi, Miktar.
- **Form:** Hesap, Piyasa, Saklamacı, Teminat Tipi, Kaynak/Hedef Depo, Para, Miktar, Açıklama.
- **API:** `GET /api/v1/collateral/holdings`, `POST /api/v1/collateral/transfers`.
- **Sonuç:** `collateral_transfers.durum = BEKLEMEDE`.
- **Kural:** kaynak_depo ≠ hedef_depo.

### Teminat Onay Ekranı — `/collateral/onay`
- **Ne:** Bekleyen talepleri onaylama / iptal / revizyon / havuz.
- **Sekmeler:** Transfer Talepleri · Dosyalı/Dosyasız · Takas Hatalı · Tamamlanmış/İptal · Problem Yönetimi.
- **BEKLEMEDE aksiyonları:** Onayla · İptal · Revizyon · Havuz.
- **API:** `GET /api/v1/collateral/transfers`, `POST .../{id}/approve|cancel|revise|pool`.
- **Kurallar:** Onay yalnız `BEKLEMEDE`; onayda kaynak depoda yeterli miktar gerekir → `TAMAMLANDI` + `collaterals` miktar güncellenir.
- **Durumlar:** BEKLEMEDE, TAMAMLANDI, IPTAL, PROBLEM, REVIZYONDA, HAVUZDA, TAKAS_HATALI.
- **Depo:** SERBEST / TEMINAT. Varlık: NAKIT, DOVIZ, PAY_SENEDI, BORCLANMA_ARACI, FON.

### Nakit İşlem Giriş — `/cash/islem-giris`
- **Butonlar:** Yeni Talep · İşlem Talebi Oluştur · Onayla ve Tamamla · Reddet · Vazgeç.
- **Grid:** Hesap, Müşteri, Kanal, Yön, Tutar, Para, Valor, Durum.
- **Form:** Hesap, Kanal, Emir Veren, Valor, Tutar, Para, İşlem Yönü, Yöntem (+IBAN/Karşı Hesap), IYM Banka, Açıklama.
- **Enum:** kanal SUBE/INTERNET/TRADEMASTER/CAGRI_MERKEZI; yön ODEME/TAHSILAT; yöntem IBAN/HESAP/YINELE_GVT; durum BEKLEMEDE/ONAYLANDI/REDDEDILDI/TAMAMLANDI.
- **API:** `GET/POST /api/v1/cash/transaction-requests`, `POST .../{id}/approve|reject`.
- **Onay kuralı:** yalnız BEKLEMEDE → TAMAMLANDI + `account_balances` güncelle (ÖDEME düşer, TAHSİLAT artar; kullanılabilir = bakiye−blokeli).

### Nakit Yönetimi — `/cash/yonetimi`
- **Salt okuma.** Grid: Hesap, Müşteri, Bakiye, Blokeli, Güncelleme.
- **API:** `GET /api/v1/cash/balances`. **DB:** `account_balances`.

### Görev Listesi (Ana Sayfa) — `/workflow/gorev-listesi`
- **Sekmeler:** Üzerimdeki Görevler · Tamamlanmış · Süreç Listesi.
- **Grid:** Süreç No, Süreç Adı, Görev Özeti, Sahip, Durum.
- **Buton:** yazma yok (salt liste).
- **API:** `GET /api/v1/workflow/tasks/acik|tamamlanmis|tumu`.
- **DB:** `workflow_processes` (ACIK/TAMAMLANDI/IPTAL), `workflow_tasks` (ACIK/TAMAMLANDI). `referans_modul`+`referans_id` loose FK.

### Kredi İşlemleri — `/credit/kredi-optimizasyon`
- **Alan:** Özkaynak Oranı (%) hedef.
- **Butonlar:** Günbaşı İşlemlerini Başlat ve Listeyi Getir · Günüçi … · Seçimi Temizle · Seçilenler için Süreç Başlat.
- **Sekmeler:** Uygun Hale Gelenler · Uygun Hale Gelmeyenler.
- **Grid:** Hesap, Hesap Adı, Ser. Bakiye, Özk. Oranı, Yeni Özk., Uygulandı.
- **Formül:** `ozkaynak = serbest_bakiye * 100 / (serbest_bakiye + kredi_bakiyesi)`.
- **API:** `POST /api/v1/credit/optimization-runs/gunbasi|gunici`, `POST .../{runId}/surec-baslat`.
- **Kural:** “Süreç Başlat” yalnızca `UYGUN_DEGIL` sonuçlarda `credit_accounts.kredi_bakiyesi` günceller; `uygulandi=1` tekrar engeller.
- **DB:** `credit_accounts`, `credit_transactions`, `credit_optimization_runs`, `credit_optimization_results`.

### CRM / Toplu Mesaj — `/crm/toplu-mesaj-gonder`
- **Alanlar:** Kampanya; Alıcılar (Hepsi / Onaylayanlar / Onaylamayanlar / Aksiyon Almayanlar / Belirli Hesaplar); Yöntem E-Mail/SMS; Şablon veya yeni içerik.
- **Buton:** Gönder (simüle — gerçek SMS/email yok).
- **API:** `GET /api/v1/crm/campaigns`, `POST /api/v1/crm/bulk-messages`.
- **DB:** `campaigns` (AKTIF/PASIF/TAMAMLANDI), `campaign_targets` (ONAYLADI/ONAYLAMADI/AKSIYON_ALMADI/BEKLIYOR), `message_templates`, `messages` (GONDERILDI/HATA).

### Risk — Yeni Hisse Emir Yönetimi — `/risk/risk-parametreleri`
- **Salt okuma.** Sekmeler: Hisse · Sabit Getiri (SGMK).
- **Gridler:** risk_profiles (Alış/Satış/Açık Satış, Grup A–D); user_limits (Günlük / Anlık limit).
- **API:** `GET /api/v1/risk/risk-profiles?tip=`, `GET /api/v1/risk/user-limits?tip=`.

### Risk — Hisse Grubu Tanımlama — `/risk/hisse-grubu-tanimlama`
- **Butonlar:** Yeni Grup · Düzenle · Sil · Kaydet.
- **Grid:** Grup Kodu, Açıklama, Üyeler, Aktif.
- **API:** `/api/v1/risk/instrument-groups`. **DB:** `instrument_groups`, `instrument_group_members`.

### Risk — Hesap/Hisse Kontrol — `/risk/hesap-hisse-kontrol`
- **Butonlar:** Yeni Kontrol · Düzenle · Sil · Kaydet.
- **Grid:** Kullanıcı, Hesap, Müşteri, Enstrüman, Alış, Satış, Açık Satış.
- **API:** `/api/v1/risk/account-instrument-controls`.

### VIOP Risk Profili — `/core/viop-risk-profili`
- **Butonlar:** Yeni Profil · Düzenle · Sil · Kaydet.
- **Grid:** Hesap, Müşteri, Profil Adı, Çarpan. Hesap başına 1 profil (UNIQUE account_id).
- **API:** `/api/v1/core/viop-risk-profiles`. **DB:** `viop_risk_profiles`.

### Kotasyon (VIOP / Hisse) — `/core/viop-kotasyon`, `/core/hisse-kotasyon`
- **Salt okuma.** Grid: Sembol, Ad, ISIN, Borsa, Aktif.
- **API:** `GET /api/v1/core/instruments?tip=VIOP|HISSE`.

### Piyasa Veri Yönetimi — `/core/piyasa-veri-yonetimi`
- **Butonlar:** Yeni Enstrüman · Düzenle · Sil · Kaydet.
- **API:** CRUD `/api/v1/core/instruments`. **DB:** `instruments` (tip HISSE/VIOP/SGMK/EUROBOND).

### Meta Pozisyon Servisi — `/meta/meta-pozisyon-servisi`
- **Pozisyon grid (okuma):** Hesap, Müşteri, Enstrüman, Miktar, Referans Fiyat → `GET /api/v1/meta/position-snapshots`.
- **Senaryo CRUD:** Yeni/Düzenle/Sil/Kaydet — Senaryo Adı, Currency Pair, Şok %, Aktif → `/api/v1/meta/shock-scenarios`.
- **DB:** `position_snapshots`, `position_shock_scenarios`.

### Rapor Yönetimi — `/report/rapor-yonetimi`
- **Butonlar:** Yeni Rapor · Düzenle · Sil · Kaydet.
- **Grid:** Rapor Adı, Sınıf, Zamanlama (MANUEL/GUNLUK/HAFTALIK/AYLIK), Mail Gönder.
- **API:** `/api/v1/report/definitions`. **DB:** `report_definitions`.

---

## Tablo envanteri (modül)

### Çekirdek
- `roles`, `users`, `user_roles`
- `customers` — musteri_no, ad_soyad_unvan, musteri_tipi, tckn_vkn, risk_grubu, aktif
- `accounts` — hesap_no, hesap_tipi (NAKIT/KREDI/VIOP), durum (AKTIF/DONDURULMUS/KAPALI)
- `instruments` — isin, sembol, tip, borsa, aktif
- `account_balances` — bakiye, blokeli_bakiye
- `audit_log` — (henüz otomatik yazılmıyor)

### Teminat
- `collaterals` — depo_tipi SERBEST/TEMINAT; varlik_tipi; miktar
- `collateral_transfers` — teminat_tipi, kaynak/hedef_depo, durum, dosyali_mi

### Nakit
- `cash_transaction_requests` — talep_kanali, islem_yonu, yontem, durum, tutar

### Kredi
- `credit_accounts` — kredi_limiti, kredi_bakiyesi, serbest_bakiye
- `credit_transactions` — ODEME/KULLANIM, GUNBASI/GUNICI
- `credit_optimization_runs`, `credit_optimization_results` — UYGUN/UYGUN_DEGIL, uygulandi

### CRM
- `campaigns`, `campaign_targets`, `message_templates`, `messages`

### Workflow
- `workflow_processes`, `workflow_tasks`

### Risk
- `risk_profiles`, `user_limits`, `instrument_groups`, `instrument_group_members`, `account_instrument_controls`

### Müşteri ek
- `viop_risk_profiles`, `channel_authorizations`

### Meta / Rapor
- `position_shock_scenarios`, `position_snapshots`, `report_definitions`

### Henüz tablo yok (placeholder menüler)
orders, special_rate_definitions, bank_integration_transactions, account_suspension_rules, repo_deals, otc_deals, ipo_*, report_runs, regulatory_reports, research_reports, market_data_feeds, crm_tickets, circuit_breaker_events, …

---

## Sık sorulan yönlendirmeler

| Kullanıcı ister | Yönlendir |
|-----------------|-----------|
| Kullanıcı / rol yetkisi | Yönetim Paneli `/core/yonetim-paneli` |
| Kanal (TradeMaster) yetkisi | TradeMaster Yetkilendirme |
| Teminat talebi oluştur | Teminat İşlemleri → Yeni Transfer Talebi |
| Teminat onayla/iptal | Teminat Onay Ekranı → BEKLEMEDE satır → Onayla/İptal/… |
| Nakit ödeme/tahsilat | Nakit İşlem Giriş |
| Bakiyeleri gör | Nakit Yönetimi |
| Görevlerim | Ana Sayfa `/workflow/gorev-listesi` |
| Müşteri kartı | Müşteri Yönetim Sistemi |
| Toplu SMS/e-posta | CRM / Müşteri İletişim Panosu |
| Kredi özkaynak düzelt | Kredi İşlemleri → Günbaşı/Günüçi → Süreç Başlat |
| Hisse grubu | Hisse Grubu Tanımlama |
| Emir limitleri (salt okuma) | Yeni Hisse Emir Yönetimi |
| Enstrüman ekle | Piyasa Veri Yönetimi |
| Rapor tanımı | Rapor Yönetimi |

---

## Asistan kuralları

1. Türkçe karakterleri doğru kullan; adım adım, kısa madde işaretleri.
2. Ekran path + buton adını açık yaz. Placeholder menüdeyse “yapım aşamasında / tablo yok” de.
3. Canlı liste/detay için tool çağır; tool dışı veri uydurma.
4. **Danışman mod:** yazma işlemini kullanıcı ekranda yapsın veya Yürütücü moda geçmesini söyle; “ben yaptım” deme.
5. **Yürütücü mod:** yazma tool çağır; UI onay kartı zorunlu — “onay kartını kullanın” de.
6. SQL isterse yalnızca **SELECT** örneği ver; DML yok. Procedure yok — söyle.
7. Bu dosyada olmayan detayda uydurma; “bilgi tabanında yok, ilgili ekranı/db/README’yi kontrol edin” de.
