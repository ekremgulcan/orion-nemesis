-- =============================================================
-- V37: notification_types tablosundaki "PARTIALLY_FILLED" kod
-- celismesi giderilir.
--
-- V36'da eklenen 7. satir (kod=PARTIALLY_FILLED, ad="Emriniz Kismi
-- Gerceklesti") tamamen kurgusaldi - gercek/production karsiligi yoktu.
-- Bildirim Ayarlari ekrani icin paylasilan gercek kanal-sablon verisinde
-- (production JSON) kod=PARTIALLY_FILLED aslinda "Emrinizin Durumunda
-- Degisiklik Oldu" icerigine karsilik geliyor - bu icerik bizim
-- tarafimizda zaten STATUS_CHANGED kodu altinda mevcuttu (V36'da
-- EMIR_DURUM_DEGISIKLIGI'nden hizalanmisti). Gercek veri, kurgusal
-- satirin gereksiz oldugunu kanitladigi icin siliniyor, STATUS_CHANGED
-- ise gercek production koduna (PARTIALLY_FILLED) yeniden adlandiriliyor.
--
-- Musteri Bildirim Tercihleri ekrani ayni tabloyu paylastigindan, kurgusal
-- satir icin lazy-create edilmis olabilecek musteri tercihi kayitlari da
-- (FK: musteri_bildirim_tercihleri.notification_type_id, ON DELETE CASCADE
-- yok) once temizlenir, sonra satirin kendisi silinir.
--
-- Sonuc: notification_types 7 satirdan tekrar 6 satira duser, tumu
-- gercek/production kod degerleriyle hizali; VIOP_MARGINCALL sira=7'den
-- tekrar 6'ya cekilerek sira numaralari bosluksuz kalir.
-- =============================================================

DELETE FROM musteri_bildirim_tercihleri
WHERE notification_type_id = (
    SELECT notification_type_id FROM notification_types WHERE kod = 'PARTIALLY_FILLED'
);

DELETE FROM notification_types WHERE kod = 'PARTIALLY_FILLED';

UPDATE notification_types SET kod = 'PARTIALLY_FILLED' WHERE kod = 'STATUS_CHANGED';

UPDATE notification_types SET sira = 6 WHERE kod = 'VIOP_MARGINCALL';
