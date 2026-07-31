-- =============================================================
-- V18: Rapor Yonetimi mock veri
-- =============================================================

INSERT INTO report_definitions (rapor_adi, rapor_sinifi, zamanlama, mail_gonder, icerik, olusturan_kullanici_id, degistiren_kullanici_id) VALUES
    (N'Gunluk Pozisyon Raporu',      'com.orion.report.GunlukPozisyonRaporu',    'GUNLUK',  1,
     N'<h3>Gunluk Pozisyon Raporu</h3><p>Hesap bazinda gun sonu pozisyon ozeti.</p>', 1, 1),
    (N'Kredi Optimizasyon Ozeti',    'com.orion.report.KrediOptimizasyonRaporu', 'GUNLUK',  1,
     N'<h3>Kredi Optimizasyon Ozeti</h3><p>Gun ici calistirilan optimizasyon sonuclarinin ozeti.</p>', 1, 3),
    (N'Haftalik Teminat Hareketleri','com.orion.report.TeminatHareketRaporu',    'HAFTALIK', 0,
     N'<h3>Haftalik Teminat Hareketleri</h3><p>Serbest/teminat deposu transfer hareket dokumu.</p>', 2, 2),
    (N'Aylik Musteri Risk Dagilimi', 'com.orion.report.MusteriRiskDagilimRaporu','AYLIK',   1,
     N'<h3>Aylik Musteri Risk Dagilimi</h3><p>Musteri risk grubu bazinda dagilim.</p>', 1, 1),
    (N'Manuel Islem Denetim Raporu', 'com.orion.report.IslemDenetimRaporu',      'MANUEL',  0,
     N'<h3>Islem Denetim Raporu</h3><p>Talep uzerine calistirilan denetim raporu.</p>', 2, 2);
