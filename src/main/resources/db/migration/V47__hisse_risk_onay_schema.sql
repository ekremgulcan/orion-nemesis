-- =============================================================
-- V47: Hisse Risk Parametreleri Onay Altyapisi
-- "Onaya Gonder" akisi icin gerekli tablolar:
--   1) surec_tipi_onay_rolleri  -> hangi ekran hangi rol tarafindan onaylanir
--   2) hisse_risk_parametreleri_talepleri -> onay bekleyen degisiklik talepleri
-- =============================================================

-- -----------------------------------------------------------
-- 1) Surec Tipi -> Onay Rolu eslestirme tablosu (generic)
--    Her yeni onay ekrani buraya bir satir ekler.
-- -----------------------------------------------------------
CREATE TABLE surec_tipi_onay_rolleri (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    surec_tipi       VARCHAR(80)  NOT NULL,
    rol_adi          VARCHAR(50)  NOT NULL,
    aktif            BIT          NOT NULL DEFAULT 1,
    olusturma_tarihi DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_surec_tipi_rol UNIQUE (surec_tipi, rol_adi)
);

-- -----------------------------------------------------------
-- 2) Hisse Risk Parametreleri talep (staging) tablosu
--    Onay bekleyen degisiklikler burada bekler.
--    Onaylanirsa -> hisse_risk_parametreleri tablosuna yazilir.
--    Reddedilirse -> durum REDDEDILDI olarak kalir.
-- -----------------------------------------------------------
CREATE TABLE hisse_risk_parametreleri_talepleri (
    talep_id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    process_id              BIGINT        NOT NULL REFERENCES workflow_processes(process_id),
    talep_eden_user_id      BIGINT        NOT NULL REFERENCES users(user_id),
    account_id              BIGINT        NOT NULL REFERENCES accounts(account_id),
    durum                   VARCHAR(20)   NOT NULL DEFAULT 'BEKLEMEDE',
    onceki_deger_json       NVARCHAR(MAX) NOT NULL,
    yeni_deger_json         NVARCHAR(MAX) NOT NULL,
    degisiklik_listesi_json NVARCHAR(MAX) NOT NULL,
    aciklama                NVARCHAR(500) NULL,
    olusturma_tarihi        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    karar_tarihi            DATETIME2     NULL,
    karar_veren_user_id     BIGINT        NULL REFERENCES users(user_id),

    CONSTRAINT ck_hrpt_durum CHECK (durum IN ('BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI'))
);

CREATE INDEX ix_hrpt_process_id  ON hisse_risk_parametreleri_talepleri(process_id);
CREATE INDEX ix_hrpt_durum       ON hisse_risk_parametreleri_talepleri(durum, olusturma_tarihi);
CREATE INDEX ix_hrpt_account_id  ON hisse_risk_parametreleri_talepleri(account_id);

-- -----------------------------------------------------------
-- 3) Seed: Hisse Risk Parametreleri -> OPERASYON rolu onaylar
-- -----------------------------------------------------------
INSERT INTO surec_tipi_onay_rolleri (surec_tipi, rol_adi) VALUES
    ('HISSE_RISK_PARAMETRELERI_ONAY', 'OPERASYON');