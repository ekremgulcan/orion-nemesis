-- =============================================================
-- V35: Bildirim tipi katalogu (mock/referans veri)
-- Musteri Bildirim Tercihleri ekraninda gosterilen 6 bildirim tipi.
-- VIOP Margin Call zorunlu (kullanici tarafindan kapatilamaz).
-- =============================================================

INSERT INTO notification_types (kod, ad, aciklama, zorunlu, sira) VALUES
('EMIR_TAMAMI_GERCEKLESTI', 'Emrinizin Tamami Gerceklesti',
 'Emrinizin tamami gerceklestiginde bilgilendirilirsiniz.', 0, 1),
('TARIHLI_EMIR_TAMAMI_GERCEKLESTI', 'Tarihli Emrinizin Tamami Gerceklesti',
 'Tarihli (GTD/GTC) emrinizin tamami gerceklestiginde bilgilendirilirsiniz.', 0, 2),
('EMIR_KISMI_GERCEKLESTI_KALANI_IPTAL', 'Emriniz Kismi Gerceklesti Kalani Iptal Oldu',
 'Emrinizin bir kismi gerceklesip kalan kismi iptal oldugunda bilgilendirilirsiniz.', 0, 3),
('EMIR_TAMAMI_BORSA_IPTAL', 'Emrinizin Tamami Borsa Tarafindan Iptal Oldu',
 'Emrinizin tamami borsa tarafindan iptal edildiginde bilgilendirilirsiniz.', 0, 4),
('EMIR_DURUM_DEGISIKLIGI', 'Emrinizin Durumunda Degisiklik Oldu',
 'Emrinizin durumunda herhangi bir degisiklik oldugunda bilgilendirilirsiniz.', 0, 5),
('VIOP_MARGIN_CALL', 'VIOP Margin Call Bildirimi',
 'Yasal zorunluluk geregi VIOP teminat tamamlama (margin call) bildirimi kapatilamaz.', 1, 6);
