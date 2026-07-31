-- =============================================================
-- V7: CRM mock veri
-- Ekran gorselindeki "Mutabakat 2026 Test679" kampanyasi ve hesap 13104
-- ornegiyle tutarli veri.
-- =============================================================

INSERT INTO campaigns (kampanya_adi, baslangic_tarihi, bitis_tarihi, durum) VALUES
    (N'Mutabakat 2026 Test679', '2026-07-01', '2026-07-31', 'AKTIF'),
    (N'Yatirimci Bilgilendirme Temmuz', '2026-07-05', NULL, 'AKTIF'),
    (N'VIOP Riskli Hesap Uyarisi', '2026-06-20', '2026-06-30', 'TAMAMLANDI');

-- Kampanya 1 (Mutabakat 2026 Test679) icin hedef hesaplar - hesap 13104 dahil
INSERT INTO campaign_targets (campaign_id, account_id, onay_durumu) VALUES
    (1, 18, 'ONAYLADI'),   -- 13104
    (1, 15, 'ONAYLAMADI'), -- 13101
    (1, 20, 'BEKLIYOR'),   -- 13106
    (1, 24, 'AKSIYON_ALMADI'), -- 13111
    (1, 27, 'ONAYLADI');   -- 13114

INSERT INTO campaign_targets (campaign_id, account_id, onay_durumu)
SELECT 2, account_id, 'BEKLIYOR' FROM accounts WHERE hesap_tipi = 'NAKIT';

INSERT INTO message_templates (campaign_id, kanal, icerik) VALUES
    (1, 'SMS', N'Sayin musterimiz, mutabakat surecimiz icin onayinizi bekliyoruz.'),
    (1, 'EMAIL', N'Sayin musterimiz, 2026 yili mutabakat mektubunuz icin lutfen sisteme giris yapiniz.'),
    (2, 'EMAIL', N'Temmuz ayi yatirimci bilgilendirme bultenimiz ekte yer almaktadir.');

-- Ekran gorselindeki senaryo: hesap 13104'e SMS gonderimi
INSERT INTO messages (campaign_id, account_id, kanal, icerik, durum) VALUES
    (1, 18, 'SMS', N'Sayin musterimiz, mutabakat surecimiz icin onayinizi bekliyoruz.', 'GONDERILDI');
