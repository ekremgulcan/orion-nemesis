-- =============================================================
-- V15: Nakit Yonetimi - Islem Giris modulu
-- Ekran: "Nakit Yonetimi > Islem Giris" (para transfer talebi formu)
-- =============================================================

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
