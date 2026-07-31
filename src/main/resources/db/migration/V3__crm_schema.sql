-- =============================================================
-- V3: CRM / Musteri Iletisim modulu
-- "Toplu Mesaj Gonder" ekrani bu tablolari kullanir.
-- =============================================================

CREATE TABLE campaigns (
    campaign_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    kampanya_adi     NVARCHAR(150) NOT NULL,
    baslangic_tarihi DATETIME2 NOT NULL,
    bitis_tarihi     DATETIME2 NULL,
    durum            VARCHAR(20) NOT NULL DEFAULT 'AKTIF' -- AKTIF / PASIF / TAMAMLANDI
);

-- Kampanyaya dahil edilen hesaplar ve onay durumlari
-- (ekrandaki Hepsi/Onaylayanlar/Onaylamayanlar/Aksiyon Almayanlar filtresi buradan gelir)
CREATE TABLE campaign_targets (
    campaign_target_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    campaign_id         BIGINT NOT NULL REFERENCES campaigns(campaign_id),
    account_id          BIGINT NOT NULL REFERENCES accounts(account_id),
    onay_durumu         VARCHAR(20) NOT NULL DEFAULT 'BEKLIYOR' -- ONAYLADI / ONAYLAMADI / AKSIYON_ALMADI / BEKLIYOR
);

CREATE TABLE message_templates (
    template_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    campaign_id  BIGINT NULL REFERENCES campaigns(campaign_id),
    kanal        VARCHAR(10) NOT NULL,        -- EMAIL / SMS
    icerik       NVARCHAR(MAX) NOT NULL
);

-- Gonderilen her mesaj icin bir kayit (gercek SMS/Email saglayicisina
-- baglanmadan, DB'ye "gonderildi" olarak yazarak simule ediyoruz).
CREATE TABLE messages (
    message_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    campaign_id      BIGINT NOT NULL REFERENCES campaigns(campaign_id),
    account_id       BIGINT NOT NULL REFERENCES accounts(account_id),
    kanal            VARCHAR(10) NOT NULL,     -- EMAIL / SMS
    icerik           NVARCHAR(MAX) NOT NULL,
    gonderim_tarihi  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    durum            VARCHAR(20) NOT NULL DEFAULT 'GONDERILDI' -- GONDERILDI / HATA
);
