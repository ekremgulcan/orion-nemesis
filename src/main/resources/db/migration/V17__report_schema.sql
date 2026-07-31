-- =============================================================
-- V17: Rapor Yonetimi modulu
-- Ekran: "Rapor Tanimlari" (rapor listesi + Rapor Ekle/Duzenle modal)
-- CKEditor gercek zengin metin editoru DEGIL, basit cok satirli
-- textbox ile simule edilir (icerik alani duz metin/HTML tutar).
-- =============================================================

CREATE TABLE report_definitions (
    report_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    rapor_adi            NVARCHAR(150) NOT NULL,
    rapor_sinifi         VARCHAR(100)  NOT NULL,       -- ornek: com.orion.report.GunlukPozisyonRaporu
    zamanlama            VARCHAR(50)   NOT NULL DEFAULT 'MANUEL', -- MANUEL / GUNLUK / HAFTALIK / AYLIK
    mail_gonder          BIT           NOT NULL DEFAULT 0,
    icerik               NVARCHAR(MAX) NULL,           -- rapor sablonu (basit metin/HTML)
    aktif                BIT           NOT NULL DEFAULT 1,
    olusturan_kullanici_id BIGINT      NULL REFERENCES users(user_id),
    degistiren_kullanici_id BIGINT     NULL REFERENCES users(user_id),
    olusturma_tarihi     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    guncelleme_tarihi    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
