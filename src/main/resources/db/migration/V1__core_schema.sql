-- =============================================================
-- V1: Cekirdek (ortak) semasi
-- Butun modullerin uzerine oturdugu temel tablolar: musteri, hesap,
-- enstruman, kullanici/rol, denetim kaydi.
-- =============================================================

CREATE TABLE roles (
    role_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    rol_adi       VARCHAR(50)   NOT NULL UNIQUE,
    aciklama      NVARCHAR(200) NULL
);

CREATE TABLE users (
    user_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    kullanici_adi  VARCHAR(50)   NOT NULL UNIQUE,
    ad_soyad       NVARCHAR(150) NOT NULL,
    email          VARCHAR(150)  NULL,
    aktif          BIT           NOT NULL DEFAULT 1,
    olusturma_tarihi DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE customers (
    customer_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    musteri_no        VARCHAR(20)   NOT NULL UNIQUE,
    ad_soyad_unvan    NVARCHAR(150) NOT NULL,
    musteri_tipi      VARCHAR(20)   NOT NULL,           -- BIREYSEL / KURUMSAL
    tckn_vkn          VARCHAR(11)   NOT NULL UNIQUE,
    risk_grubu        VARCHAR(20)   NOT NULL DEFAULT 'ORTA', -- DUSUK / ORTA / YUKSEK
    telefon           VARCHAR(20)   NULL,
    email             VARCHAR(150)  NULL,
    olusturma_tarihi  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    aktif             BIT           NOT NULL DEFAULT 1
);

CREATE TABLE accounts (
    account_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    hesap_no       VARCHAR(20) NOT NULL UNIQUE,
    customer_id    BIGINT      NOT NULL REFERENCES customers(customer_id),
    hesap_tipi     VARCHAR(20) NOT NULL,                -- NAKIT / KREDI / VIOP
    durum          VARCHAR(20) NOT NULL DEFAULT 'AKTIF', -- AKTIF / DONDURULMUS / KAPALI
    acilis_tarihi  DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE instruments (
    instrument_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    isin          VARCHAR(12)   NOT NULL UNIQUE,
    sembol        VARCHAR(20)   NOT NULL,
    ad            NVARCHAR(150) NOT NULL,
    tip           VARCHAR(20)   NOT NULL,               -- HISSE / VIOP / SGMK / EUROBOND
    borsa         VARCHAR(20)   NOT NULL DEFAULT 'BIST',
    aktif         BIT           NOT NULL DEFAULT 1
);

CREATE TABLE account_balances (
    balance_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT NOT NULL REFERENCES accounts(account_id),
    bakiye            DECIMAL(18,2) NOT NULL DEFAULT 0,
    blokeli_bakiye    DECIMAL(18,2) NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE audit_log (
    audit_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    islem_tarihi   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    kullanici_adi  VARCHAR(50) NULL,
    modul          VARCHAR(50) NOT NULL,
    islem_tipi     VARCHAR(50) NOT NULL,
    detay          NVARCHAR(MAX) NULL
);
