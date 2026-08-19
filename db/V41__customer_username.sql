-- =============================================================
-- V41: customers.username kolonu eklenir.
--
-- Musteri Bildirim Tercihleri servis dokumaninin GET/POST uc noktalari
-- musteriyi "username" (login) ile tanimliyor, "Musteri No" ile degil.
-- Bu uygulamada gercek bir login/oturum kavrami yok (bkz. daha onceki
-- migration notlari), bu yuzden customers tablosuna gercek, ayri bir
-- username kolonu ekleniyor - ekranin "Musteri No ile arama" davranisi
-- degismiyor (musteriSorgulamaKutusu.zul hala musteri_no kullanir),
-- ama musteri bulunduktan sonra bildirim tercihleri servisiyle konusurken
-- customer.username degeri gonderilir/aranir.
--
-- Backfill: mevcut 101 musteri icin ad_soyad_unvan alanindan turetilen,
-- garanti benzersiz bir mock username uretilir (kucuk harf, bosluklar
-- nokta ile degistirilir, sonuna musteri_no'nun son 3 hanesi eklenir -
-- orn. "Ahmet Yilmaz" + "M000001" -> "ahmet.yilmaz.001"). musteri_no zaten
-- benzersiz oldugu icin bu format ek bir çakışma kontrolüne gerek
-- birakmadan garanti benzersizdir.
-- =============================================================

ALTER TABLE customers ADD username VARCHAR(80) NULL;
GO

UPDATE customers
SET username = LOWER(REPLACE(LTRIM(RTRIM(ad_soyad_unvan)), ' ', '.')) + '.' + RIGHT(musteri_no, 3);
GO

ALTER TABLE customers ALTER COLUMN username VARCHAR(80) NOT NULL;
ALTER TABLE customers ADD CONSTRAINT uq_customers_username UNIQUE (username);
