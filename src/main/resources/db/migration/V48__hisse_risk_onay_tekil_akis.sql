-- =============================================================
-- V48: Hisse Risk Parametreleri Tekil Akis Onay Altyapisi
-- =============================================================

ALTER TABLE hisse_risk_parametreleri_talepleri 
ADD talep_turu VARCHAR(30) NOT NULL DEFAULT 'TOPLU_GUNCELLEME';
GO

ALTER TABLE hisse_risk_parametreleri_talepleri
ADD CONSTRAINT ck_hrpt_talep_turu CHECK (talep_turu IN ('TOPLU_GUNCELLEME', 'EKLE', 'DUZENLE', 'SIL'));
GO
