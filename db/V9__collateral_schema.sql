-- =============================================================
-- V9: Teminat Islemleri modulu
-- Ekranlar: "Teminat Transfer", "Teminat Onay Ekrani", "Teminat Dosya Yukleme"
-- =============================================================

-- Bir hesabin serbest depo / teminat deposu tarafinda tuttugu varlik kalemleri.
CREATE TABLE collaterals (
    collateral_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id        BIGINT NOT NULL REFERENCES accounts(account_id),
    depo_tipi         VARCHAR(20)   NOT NULL,          -- SERBEST / TEMINAT
    varlik_tipi       VARCHAR(20)   NOT NULL,          -- NAKIT / DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON
    instrument_id     BIGINT        NULL REFERENCES instruments(instrument_id), -- NAKIT/DOVIZ icin NULL olabilir
    para_birimi       VARCHAR(10)   NULL,              -- DOVIZ/NAKIT icin (TRY/USD/EUR)
    miktar            DECIMAL(18,4) NOT NULL DEFAULT 0,
    guncelleme_tarihi DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

-- "Teminat Transfer" ekraninda olusturulan, "Teminat Onay Ekrani" tab'larinda
-- (Transfer Talepleri / Dosyali-Dosyasiz Islemler / Takas WebServis Hatali /
-- Tamamlanmis-Iptal Edilmis / Problem Yonetimindeki Transferler) izlenen kayitlar.
CREATE TABLE collateral_transfers (
    transfer_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id         BIGINT        NOT NULL REFERENCES accounts(account_id),
    piyasa             VARCHAR(20)   NOT NULL DEFAULT 'BIST',
    saklamaci          VARCHAR(50)   NOT NULL DEFAULT 'MKK',
    teminat_tipi       VARCHAR(20)   NOT NULL,          -- NAKIT_DOVIZ / PAY_SENEDI / BORCLANMA_ARACI / FON
    kaynak_depo        VARCHAR(20)   NOT NULL,          -- SERBEST / TEMINAT
    hedef_depo         VARCHAR(20)   NOT NULL,          -- TEMINAT / SERBEST
    instrument_id      BIGINT        NULL REFERENCES instruments(instrument_id),
    para_birimi        VARCHAR(10)   NULL,
    miktar             DECIMAL(18,4) NOT NULL,
    dosyali_mi         BIT           NOT NULL DEFAULT 0, -- Excel toplu yukleme ile mi geldi
    durum              VARCHAR(30)   NOT NULL DEFAULT 'BEKLEMEDE', -- BEKLEMEDE/TAMAMLANDI/IPTAL/PROBLEM/REVIZYONDA/HAVUZDA/TAKAS_HATALI
    talep_eden_kullanici_id BIGINT   NULL REFERENCES users(user_id),
    onaylayan_kullanici_id  BIGINT   NULL REFERENCES users(user_id),
    talep_tarihi       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    onay_tarihi        DATETIME2     NULL,
    aciklama           NVARCHAR(300) NULL
);
