-- =============================================================
-- V50: Musteri Bildirim Tercihleri Onay Altyapisi
--   1) Staging tablosu: onay bekleyen tercih degisiklikleri
--   2) Seed: MUSTERI_BILDIRIM_TERCIHLERI_ONAY -> MUSTERI_TEMSILCISI
-- =============================================================

CREATE TABLE musteri_bildirim_tercihleri_talepleri (
    talep_id                BIGINT IDENTITY(1,1) PRIMARY KEY,
    process_id              BIGINT        NOT NULL REFERENCES workflow_processes(process_id),
    talep_eden_user_id      BIGINT        NOT NULL REFERENCES users(user_id),
    customer_id             BIGINT        NOT NULL REFERENCES customers(customer_id),
    durum                   VARCHAR(20)   NOT NULL DEFAULT 'BEKLEMEDE',
    onceki_deger_json       NVARCHAR(MAX) NOT NULL,
    yeni_deger_json         NVARCHAR(MAX) NOT NULL,
    degisiklik_listesi_json NVARCHAR(MAX) NOT NULL,
    olusturma_tarihi        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    karar_tarihi            DATETIME2     NULL,
    karar_veren_user_id     BIGINT        NULL REFERENCES users(user_id),

    CONSTRAINT ck_mbt_durum CHECK (durum IN ('BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI'))
);

CREATE INDEX ix_mbt_process_id  ON musteri_bildirim_tercihleri_talepleri(process_id);
CREATE INDEX ix_mbt_customer_id ON musteri_bildirim_tercihleri_talepleri(customer_id);

INSERT INTO surec_tipi_onay_rolleri (surec_tipi, rol_adi)
VALUES ('MUSTERI_BILDIRIM_TERCIHLERI_ONAY', 'MUSTERI_TEMSILCISI');
