-- =============================================================
-- V2: Kredi Islemleri modulu
-- "Yeni Kredi Optimizasyon ve Odeme Islemleri Ekrani" bu tablolari kullanir.
-- =============================================================

CREATE TABLE credit_accounts (
    credit_account_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT NOT NULL REFERENCES accounts(account_id),
    kredi_limiti       DECIMAL(18,2) NOT NULL,
    kredi_bakiyesi     DECIMAL(18,2) NOT NULL DEFAULT 0, -- kullanilan kredi
    serbest_bakiye     DECIMAL(18,2) NOT NULL DEFAULT 0, -- teminatta olup krediye baglanmamis kisim
    guncelleme_tarihi  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE credit_transactions (
    credit_transaction_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    credit_account_id     BIGINT NOT NULL REFERENCES credit_accounts(credit_account_id),
    tutar                  DECIMAL(18,2) NOT NULL,
    islem_tipi             VARCHAR(20) NOT NULL,        -- ODEME / KULLANIM
    gun_tipi               VARCHAR(20) NOT NULL,        -- GUNBASI / GUNICI
    islem_tarihi           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Her "Gunbasi/Gunici Islemlerini Baslat" tiklamasi bir run kaydi yaratir.
CREATE TABLE credit_optimization_runs (
    run_id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    calistiran_kullanici_id BIGINT NOT NULL REFERENCES users(user_id),
    gun_tipi                VARCHAR(20) NOT NULL,       -- GUNBASI / GUNICI
    hedef_ozkaynak_orani    DECIMAL(5,2) NOT NULL,
    calisma_tarihi          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Her run, her kredi hesabi icin bir sonuc satiri uretir (ekrandaki grid budur).
CREATE TABLE credit_optimization_results (
    result_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    run_id             BIGINT NOT NULL REFERENCES credit_optimization_runs(run_id),
    account_id         BIGINT NOT NULL REFERENCES accounts(account_id),
    serbest_bakiye     DECIMAL(18,2) NOT NULL,
    mevcut_ozkaynak_orani DECIMAL(5,2) NOT NULL,
    yeni_ozkaynak_orani   DECIMAL(5,2) NOT NULL,
    durum              VARCHAR(20) NOT NULL,           -- UYGUN / UYGUN_DEGIL
    komposizyon        NVARCHAR(MAX) NULL              -- JSON: enstruman/miktar kirilimi
);
