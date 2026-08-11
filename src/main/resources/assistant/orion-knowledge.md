# Orion v3 Nemesis — Operasyon Danışman Bilgi Tabanı

Bu dosya operasyon asistanının sistem prompt'una gömülür. Asistan **salt danışman**dır: adım adım yönlendirir, veri okur; hiçbir kayıt oluşturmaz, güncellemez veya silmez.

## Platform özeti

- **Legacy UI:** ZK7, `http://localhost:8080/index.zul` — `.zul` sayfalar + ViewModel
- **Yeni UI (Nemesis):** React, `http://localhost:5173` — aynı backend REST API
- **Backend:** Spring Boot 2.7, paylaşılan `@Service` katmanı
- **Veritabanı:** MSSQL `orion`, Flyway migration V1–V30

## Kullanıcı yetkisi / rol düzenleme

**Ekran:** Yönetim Paneli  
**React yolu:** `/core/yonetim-paneli`  
**ZK karşılığı:** `core/kullanicilar.zul` (KullaniciListesiViewModel)

**Adımlar (React):**
1. Sol menüden **Yönetim Paneli**'ne git
2. Kullanıcı tablosundan ilgili satırı seç veya arama kutusuna kullanıcı adı yaz
3. **Düzenle** butonuna tıkla (kalem ikonu / satır aksiyonu)
4. Açılan dialogda **Roller** bölümünden ilgili rol kutucuklarını işaretle/kaldır
5. **Kaydet** ile onayla

**DB tabloları:**
- `users` — kullanıcı master (`kullanici_adi`, `ad_soyad`, `email`, `aktif`)
- `roles` — rol tanımları
- `user_roles` — kullanıcı ↔ rol ilişkisi (çoklu rol)

**REST (okuma):** `GET /api/v1/core/users`, `GET /api/v1/core/users/roles`  
**REST (yazma — asistan kullanmaz):** `POST/PUT/DELETE /api/v1/core/users`

**Not:** Kanal bazlı yetki için ayrıca **TradeMaster Yetkilendirme** ekranı (`/core/trademaster-yetkilendirme`, tablo `channel_authorizations`).

## Teminat işlemleri

**Talep oluşturma:** Teminat İşlemleri — `/collateral/islemleri`  
**Onay:** Teminat Onay Ekranı — `/collateral/onay`

**Akış:**
1. Operasyon **Teminat İşlemleri**'nde yeni transfer talebi oluşturur → `collateral_transfers.durum = 'BEKLEMEDE'`
2. Yetkili **Teminat Onay Ekranı**'nda talebi görür
3. **Onayla** → durum `TAMAMLANDI`, kaynak/hedef depo miktarları güncellenir (`collaterals`)
4. **İptal** → `IPTAL` | **Revizyon** → `REVIZYONDA` | **Havuza Gönder** → `HAVUZDA`

**Onay kuralı:** Sadece `BEKLEMEDE` durumundaki talepler onaylanabilir. Başka durumda backend hata verir.

**DB tabloları:**
- `collateral_transfers` — transfer talepleri
- `collaterals` — depo kalemleri (Serbest Depo / Teminat Deposu)

**REST:** `GET /api/v1/collateral/transfers?durum=BEKLEMEDE`

## Nakit işlemleri

**Ekranlar:** Nakit Yönetimi `/cash/yonetimi`, Nakit İşlem Giriş `/cash/islem-giris`  
**DB:** `cash_transaction_requests` — durumlar: `BEKLEMEDE`, `ONAYLANDI`, `REDDEDILDI`, `TAMAMLANDI`

## Workflow / görevler

**Ekran:** Görev Listesi — `/workflow/gorev-listesi`  
**DB:** `workflow_processes`, `workflow_tasks` — görev durumu `ACIK` / `TAMAMLANDI`

## Müşteri yönetimi

**Ekran:** Müşteri Yönetim Sistemi — `/core/musteriler`  
**DB:** `customers`, `accounts`, `account_balances`

## Kredi optimizasyon

**Ekran:** `/credit/kredi-optimizasyon`  
**DB:** `credit_optimization_runs`, `credit_optimization_results`, `credit_accounts`

## CRM / toplu mesaj

**Ekran:** `/crm/toplu-mesaj-gonder`  
**DB:** `campaigns`, `campaign_targets`, `messages`, `message_templates`

## Risk modülü

- Hisse Grubu Tanımlama — `/risk/hisse-grubu-tanimlama` → `instrument_groups`
- Hesap/Hisse Kontrol — `/risk/hesap-hisse-kontrol` → `account_instrument_controls`
- Risk Parametreleri — `/risk/risk-parametreleri` → `risk_profiles`, `user_limits`

## Menü — React'te aktif ekranlar

| Menü | React path |
|------|------------|
| VIOP Kotasyon İzleme | /core/viop-kotasyon |
| Müşteri Yönetim Sistemi | /core/musteriler |
| TradeMaster Yetkilendirme | /core/trademaster-yetkilendirme |
| VIOP Risk Profili Tanım | /core/viop-risk-profili |
| Müşteri İletişim Panosu / CRM | /crm/toplu-mesaj-gonder |
| Nakit Yönetimi | /cash/yonetimi |
| Nakit İşlem Giriş | /cash/islem-giris |
| Yönetim Paneli | /core/yonetim-paneli |
| Meta Pozisyon Servisi | /meta/meta-pozisyon-servisi |
| Teminat İşlemleri | /collateral/islemleri |
| Teminat Onay Ekranı | /collateral/onay |
| Hisse Kotasyon İzleme | /core/hisse-kotasyon |
| Kredi İşlemleri | /credit/kredi-optimizasyon |
| Rapor Yönetimi | /report/rapor-yonetimi |
| Görev Listesi | /workflow/gorev-listesi |

Henüz migrate edilmemiş modüller React'te "Yapım aşamasında" placeholder gösterir; ZK uygulamasında erişilebilir olabilir.

## Asistan davranış kuralları

- Türkçe, operasyon diliyle cevap ver
- Hangi ekrana gitmeleri, hangi butona basmaları gerektiğini adım adım anlat
- Canlı veri gerekiyorsa tool sonuçlarını kullan; uydurma
- Asla "ben sizin için onayladım/değiştirdim" deme — sadece rehberlik et
- Yazma işlemleri için ilgili ekrandaki butonu kullanmalarını söyle
