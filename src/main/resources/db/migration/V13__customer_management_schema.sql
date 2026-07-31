-- =============================================================
-- V13: Musteri Yonetim Sistemi - VIOP Risk Profili ve TradeMaster
-- Yetkilendirme
-- Ekranlar: "Hesap Bazinda VIOP Risk Profili Tanim", "TradeMaster
-- Yetkilendirme"
-- =============================================================

-- Hesap bazinda VIOP risk profili atamasi (Kurum Temkinli 2 kat,
-- Kurum Standart 1.5 kat, Takasbank Birebir gibi profiller).
CREATE TABLE viop_risk_profiles (
    viop_risk_profile_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id           BIGINT        NOT NULL REFERENCES accounts(account_id) UNIQUE,
    profil_adi           VARCHAR(50)   NOT NULL,      -- Kurum Temkinli 2 Kat / Kurum Standart 1.5 Kat / Takasbank Birebir
    carpan               DECIMAL(5,2)  NOT NULL,      -- 2.00 / 1.50 / 1.00
    guncelleme_tarihi    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

-- TradeMaster Yetkilendirme: kullaniciya hesap + kanal bazinda yetki verilir.
CREATE TABLE channel_authorizations (
    channel_auth_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(user_id),
    account_id       BIGINT      NOT NULL REFERENCES accounts(account_id),
    kanal            VARCHAR(30) NOT NULL,             -- TRADEMASTER / INTERNET_SUBESI / MOBIL / CAGRI_MERKEZI
    yetki_durumu     VARCHAR(20) NOT NULL DEFAULT 'AKTIF', -- AKTIF / PASIF
    tanimlama_tarihi DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);
