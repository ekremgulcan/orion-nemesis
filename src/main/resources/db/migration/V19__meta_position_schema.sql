-- =============================================================
-- V19: Meta Pozisyon Servisi modulu
-- Ekran: "Pozisyon Kaydet" + Sok senaryolari (currency pair bazinda
-- sok yuzdesi tanimlayip uygulama)
-- =============================================================

CREATE TABLE position_shock_scenarios (
    scenario_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    senaryo_adi       NVARCHAR(100) NOT NULL,
    currency_pair     VARCHAR(20)   NOT NULL,          -- USD/TRY, EUR/TRY, EUR/USD, ...
    sok_yuzdesi       DECIMAL(6,2)  NOT NULL,           -- -20.00 .. +20.00 gibi
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
