-- =============================================================
-- V45: Hisse Risk Parametreleri modulu ("Yeni Hisse Emir Yonetimi" ust
-- menusu altindaki ilk gercek ekran). risk_profiles'tan bilerek AYRI
-- tutuldu: alan seti cok farkli (kontrol tipleri dropdown/tristate,
-- sayisal limitler, net varlik limit carpani, ek kredisiz bayraklari) -
-- eski risk_profiles/risk-parametreleri.zul ekrani dokunulmadan yerinde
-- birakildi.
--
-- Hesap Tipi, Musteri No, Hesap No, Musteri Adi alanlari bu tabloda TEKRAR
-- TUTULMUYOR - hepsi account_id uzerinden accounts/customers tablolarindan
-- (hesap_musteri_tipi / musteri_no / ad_soyad_unvan) okunuyor.
-- =============================================================

CREATE TABLE hisse_risk_parametreleri (
    hisse_risk_parametre_id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id                         BIGINT        NOT NULL REFERENCES accounts(account_id),
    kullanici_tipi                     VARCHAR(20)   NOT NULL,          -- Musteri / Yatirim Danismani

    alis_kontrol_tipi                  VARCHAR(20)   NOT NULL DEFAULT 'Kontrolsuz',   -- SPK Kontrollu / Nakit Kontrolu / Kontrolsuz
    satis_kontrol_tipi                 VARCHAR(20)   NOT NULL DEFAULT 'Kontrolsuz',
    acik_satis_kontrol_tipi            VARCHAR(20)   NOT NULL DEFAULT 'Kontrolsuz',

    acik_takas_limiti                  DECIMAL(18,2) NOT NULL DEFAULT 0,
    aciga_satis_limiti                 DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_varlik_limit_carpani           INT           NOT NULL DEFAULT 1,   -- 1-5 sabit liste

    kredisiz_grup_a_alis_yapabilir     BIT           NOT NULL DEFAULT 0,
    grup_b_alis_yapabilir              BIT           NOT NULL DEFAULT 0,
    grup_c_alis_yapabilir              BIT           NOT NULL DEFAULT 0,
    grup_d_alis_yapabilir              BIT           NOT NULL DEFAULT 0,

    kredisiz_grup_a_nakit_kontrol      BIT           NOT NULL DEFAULT 0,
    grup_b_nakit_kontrol               BIT           NOT NULL DEFAULT 0,
    grup_c_nakit_kontrol               BIT           NOT NULL DEFAULT 0,
    grup_d_nakit_kontrol               BIT           NOT NULL DEFAULT 0,

    kredisiz_paylarda_kontrolsuz_satis BIT           NOT NULL DEFAULT 0,

    aktif                               BIT          NOT NULL DEFAULT 1,
    guncelleme_tarihi                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX ix_hisse_risk_parametreleri_account ON hisse_risk_parametreleri(account_id);
