-- =============================================================
-- V11: Risk Parametreleri modulu (Yeni Hisse Emir Yonetimi)
-- PDF'teki "Hisse Risk Parametreleri" ve "Sabit Getiri Risk Tanimlama"
-- ekranlari, enstruman_tipi filtresiyle TEK tabloda birlestirildi
-- (kod tekrarini azaltmak icin ayri tablo/ekran yerine ortak yapi).
-- Ekranlar: "Hisse Risk Parametreleri", "Sabit Getiri Risk Tanimlama",
-- "Kullanici Limit Tanimi", "Hisse Grubu Tanimlama",
-- "Kullanici/Hesap/Hisse Bazinda Kontrol"
-- =============================================================

-- Kullanici ve/veya hesap bazinda, enstruman tipine gore alis/satis/acik
-- satis kontrolu + A/B/C/D grup nakit kontrolleri.
CREATE TABLE risk_profiles (
    risk_profile_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    enstruman_tipi    VARCHAR(20)   NOT NULL,          -- HISSE / SGMK (VIOP ayri modulde: viop_risk_profiles)
    user_id           BIGINT        NULL REFERENCES users(user_id),
    account_id        BIGINT        NULL REFERENCES accounts(account_id),
    alis_kontrol      BIT           NOT NULL DEFAULT 1,
    satis_kontrol     BIT           NOT NULL DEFAULT 1,
    acik_satis_kontrol BIT          NOT NULL DEFAULT 0,
    grup_a_nakit_kontrol BIT        NOT NULL DEFAULT 1,
    grup_b_nakit_kontrol BIT        NOT NULL DEFAULT 1,
    grup_c_nakit_kontrol BIT        NOT NULL DEFAULT 0,
    grup_d_nakit_kontrol BIT        NOT NULL DEFAULT 0,
    aktif             BIT           NOT NULL DEFAULT 1,
    guncelleme_tarihi DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

-- "Kullanici Limit Tanimi" / "Sabit Getiri Kullanici Limit Tanimi": kullanici
-- bazinda gunluk toplam limit ve anlik islem limiti (enstruman_tipi ile ayrisir).
CREATE TABLE user_limits (
    user_limit_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id             BIGINT      NOT NULL REFERENCES users(user_id),
    enstruman_tipi      VARCHAR(20) NOT NULL,          -- HISSE / SGMK
    gunluk_toplam_limit DECIMAL(18,2) NOT NULL,
    anlik_islem_limiti  DECIMAL(18,2) NOT NULL,
    guncelleme_tarihi   DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME()
);

-- "Hisse Grubu Tanimlama": risk kontrollerinde kullanilacak hisse gruplari.
CREATE TABLE instrument_groups (
    group_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    grup_kodu    VARCHAR(30)   NOT NULL UNIQUE,
    aciklama     NVARCHAR(200) NULL,
    aktif        BIT           NOT NULL DEFAULT 1
);

CREATE TABLE instrument_group_members (
    group_id      BIGINT NOT NULL REFERENCES instrument_groups(group_id),
    instrument_id BIGINT NOT NULL REFERENCES instruments(instrument_id),
    PRIMARY KEY (group_id, instrument_id)
);

-- "Kullanici/Hesap/Hisse Bazinda Kontrol": uclu kombinasyonda alis/satis/acik
-- satis izni (en detayli seviyedeki kontrol; risk_profiles'tan daha spesifik).
CREATE TABLE account_instrument_controls (
    control_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(user_id),
    account_id       BIGINT NOT NULL REFERENCES accounts(account_id),
    instrument_id    BIGINT NOT NULL REFERENCES instruments(instrument_id),
    alis_izni        BIT    NOT NULL DEFAULT 1,
    satis_izni       BIT    NOT NULL DEFAULT 1,
    acik_satis_izni  BIT    NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
